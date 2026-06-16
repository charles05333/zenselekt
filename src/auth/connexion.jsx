import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import "./css/Connexion.css";
import zenImg from "../assets/img/zen.png";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE     = import.meta.env.VITE_API_BASE || "http://localhost/backoffice";
const MAX_ATTEMPTS = 5;

// ─── Captcha Hook ─────────────────────────────────────────────────────────────
function useCaptcha() {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  const generate = () => {
    setNum1(Math.floor(Math.random() * 9) + 1);
    setNum2(Math.floor(Math.random() * 9) + 1);
  };

  useEffect(() => { generate(); }, []);

  return { num1, num2, answer: num1 + num2, generate };
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Connexion() {
  const [email,          setEmail]         = useState("");
  const [mdp,            setMdp]           = useState("");
  const [showMdp,        setShowMdp]       = useState(false);
  const [captchaInput,   setCaptchaInput]  = useState("");
  const [loading,        setLoading]       = useState(false);
  const [serverStatus,   setServerStatus]  = useState(null);
  const [checkingStatus, setCheckingStatus]= useState(false);

  const { num1, num2, answer, generate } = useCaptcha();
  const debounceRef = useRef(null);

  // ── Ref CSRF : toujours à jour, lisible dans les closures async ──────────
  // On garde aussi un state pour pouvoir re-render si besoin, mais le ref
  // est la source de vérité utilisée dans handleSubmit.
  const csrfRef = useRef("");

  // ── Fetch CSRF : retourne le token ET met à jour le ref ──────────────────
  const fetchCsrfToken = async () => {
    try {
      const res  = await fetch(`${API_BASE}/csrf-token`, {
        credentials: "include",                      // important si cookies session
        headers:     { Accept: "application/json" },
      });
      if (!res.ok) return "";
      const data = await res.json();
      if (data.success && data.csrf_token) {
        csrfRef.current = data.csrf_token;           // mise à jour immédiate du ref
        return data.csrf_token;
      }
    } catch (err) {
      console.error("[CSRF] fetch échoué :", err);
    }
    return "";
  };

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  // ── Vérification statut compte (debounce 600ms) ───────────────────────────
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setServerStatus(null);
      setCheckingStatus(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCheckingStatus(true);
      try {
        const res = await fetch(
          `${API_BASE}/compte/statut?email=${encodeURIComponent(trimmed)}`,
          { credentials: "include", headers: { Accept: "application/json" } }
        );

        if (res.status === 422 || res.status === 404) {
          setServerStatus({ found: false });
          return;
        }
        if (!res.ok) { setServerStatus(null); return; }

        const data = await res.json();
        if (data.success) {
          setServerStatus({
            found:           true,
            is_active:       data.is_active,
            is_blocked:      data.is_blocked,
            failed_attempts: data.failed_attempts ?? 0,
          });
        } else {
          setServerStatus({ found: false });
        }
      } catch {
        setServerStatus(null);
      } finally {
        setCheckingStatus(false);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [email]);

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailKey = email.trim().toLowerCase();

    // Compte bloqué détecté avant envoi
    if (serverStatus?.found && (serverStatus.is_blocked || !serverStatus.is_active)) {
      Swal.fire({
        icon: "error",
        title: "Compte bloqué",
        text: "Votre compte est bloqué. Contactez l'administrateur pour le débloquer.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    // Vérification captcha
    if (parseInt(captchaInput, 10) !== answer) {
      Swal.fire({
        icon: "warning",
        title: "Captcha incorrect",
        text: "Veuillez entrer la bonne réponse au calcul.",
        timer: 2000,
        showConfirmButton: false,
      });
      generate();
      setCaptchaInput("");
      return;
    }

    // ── Récupérer le token CSRF : utiliser le ref, ou re-fetcher si vide ──
    let csrf = csrfRef.current;
    if (!csrf) {
      csrf = await fetchCsrfToken();
    }

    // Si toujours vide après re-fetch → vrai problème réseau/CORS
    if (!csrf) {
      Swal.fire({
        icon: "error",
        title: "Erreur réseau",
        text: "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/connexion`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json", Accept: "application/json" },
        body:        JSON.stringify({ email: emailKey, mdp, csrf_token: csrf }),
      });

      const data = await res.json();

      // ── Succès ──
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.token) localStorage.setItem("token", data.token);
        Swal.fire({
          icon: "success",
          title: "Connexion réussie",
          text: `Bienvenue ${data.user.prenoms} !`,
          timer: 1500,
          showConfirmButton: false,
          willClose: () => { window.location.href = "/dashbord"; },
        });
        return;
      }

      // ── Compte bloqué par le serveur (403) ──
      if (res.status === 403 || data.blocked) {
        setServerStatus(prev => prev
          ? { ...prev, is_blocked: true, is_active: false }
          : { found: true, is_blocked: true, is_active: false, failed_attempts: MAX_ATTEMPTS }
        );
        Swal.fire({
          icon: "error",
          title: "Compte bloqué",
          text: data.message || "Trop de tentatives. Contactez l'administrateur pour débloquer votre accès.",
          confirmButtonColor: "#d33",
        });
        return;
      }

      // ── Identifiants incorrects (401) ──
      if (data.failed_attempts !== undefined) {
        const remaining = Math.max(0, MAX_ATTEMPTS - data.failed_attempts);
        setServerStatus(prev =>
          prev ? { ...prev, failed_attempts: data.failed_attempts } : null
        );
        Swal.fire({
          icon: "error",
          title: "Identifiants incorrects",
          text: remaining > 0
            ? `Email ou mot de passe incorrect. Il vous reste ${remaining} tentative${remaining > 1 ? "s" : ""}.`
            : "Email ou mot de passe incorrect.",
          confirmButtonColor: "#d33",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur de connexion",
          text: data.message || "Email ou mot de passe incorrect.",
          confirmButtonColor: "#d33",
        });
      }

      generate();
      setCaptchaInput("");
      // Renouveler le CSRF (token usage unique côté serveur)
      fetchCsrfToken();

    } catch {
      Swal.fire({
        icon: "error",
        title: "Erreur réseau",
        text: "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
      });
      fetchCsrfToken();
    } finally {
      setLoading(false);
    }
  };

  // ── États dérivés ─────────────────────────────────────────────────────────
  const isBlocked      = serverStatus?.found && (serverStatus.is_blocked || !serverStatus.is_active);
  const inputsDisabled = loading || !!isBlocked;
  const submitDisabled = loading || !!isBlocked || checkingStatus;

  return (
    <div className="cx-page">
      <div className="cx-topbar">
        <a href="/" className="cx-topbar__back">← Accueil</a>
        <div className="cx-topbar__logo">
          <img src={zenImg} alt="Zenselekt" />
        </div>
      </div>

      <div className="cx-card">
        <h2 className="cx-card__title">Se connecter à son compte</h2>

        {/* Bannière compte bloqué */}
        {isBlocked && (
          <div className="cx-blocked" role="alert">
            <p>
              <strong>Compte bloqué.</strong><br />
              Veuillez contacter l'administrateur pour débloquer votre accès.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            className="cx-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={inputsDisabled}
            autoComplete="email"
            aria-label="Adresse email"
          />

          <div className="cx-input-wrap">
            <input
              type={showMdp ? "text" : "password"}
              className="cx-input"
              placeholder="Mot de passe"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              required
              disabled={inputsDisabled}
              autoComplete="current-password"
              aria-label="Mot de passe"
            />
            <span
              className="cx-eye"
              onClick={() => !inputsDisabled && setShowMdp(v => !v)}
              role="button"
              tabIndex={0}
              aria-label={showMdp ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onKeyDown={(e) => e.key === "Enter" && !inputsDisabled && setShowMdp(v => !v)}
            >
              {showMdp ? "🙈" : "👁️"}
            </span>
          </div>

          <label className="cx-captcha-question" htmlFor="cx-captcha">
            {num1} + {num2} = ?
          </label>
          <input
            id="cx-captcha"
            type="text"
            inputMode="numeric"
            className="cx-input"
            placeholder="Votre réponse"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            required
            disabled={inputsDisabled}
            aria-label="Réponse au captcha"
          />

          <button
            type="submit"
            className="cx-btn"
            disabled={submitDisabled}
            aria-busy={loading}
          >
            {checkingStatus
              ? "Vérification..."
              : loading
              ? "Connexion en cours..."
              : isBlocked
              ? "Compte bloqué"
              : "Se connecter"}
          </button>
        </form>

        <div className="cx-links">
          <a href="/mdpoublie">Mot de passe oublié ?</a>
          {" | "}
          <a href="/inscription"><strong>Créer un compte</strong></a>
        </div>
      </div>
    </div>
  );
}