import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./css/Connexion.css";
import "./css/ResetPassword.css";
import zenImg from "../assets/img/zen.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost/backoffice";

export default function ResetPassword() {
    const [token,        setToken]        = useState("");
    const [mdp,          setMdp]          = useState("");
    const [mdpConfirm,   setMdpConfirm]   = useState("");
    const [showMdp,      setShowMdp]      = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [statut,       setStatut]       = useState("idle");   // idle | loading | invalid | success
    const [tokenValide,  setTokenValide]  = useState(null);     // null | true | false
    const [checkingToken, setCheckingToken] = useState(true);

    // ── Force requirements ────────────────────────────────────────────────
    const rules = {
        length:    mdp.length >= 8,
        uppercase: /[A-Z]/.test(mdp),
        lowercase: /[a-z]/.test(mdp),
        number:    /[0-9]/.test(mdp),
        special:   /[^A-Za-z0-9]/.test(mdp),
    };
    const rulesLabels = {
        length:    "8 caractères minimum",
        uppercase: "Une majuscule",
        lowercase: "Une minuscule",
        number:    "Un chiffre",
        special:   "Un caractère spécial",
    };
    const allRulesOk = Object.values(rules).every(Boolean);

    // ── Récupérer le token dans l'URL ─────────────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t      = params.get("token") || "";
        setToken(t);

        if (!t || t.length !== 64) {
            setTokenValide(false);
            setCheckingToken(false);
            return;
        }

        // Vérifier le token côté serveur
        (async () => {
            try {
                const res  = await fetch(
                    `${API_BASE}/reset-password/verify?token=${encodeURIComponent(t)}`,
                    { headers: { Accept: "application/json" } }
                );
                const data = await res.json();
                setTokenValide(data.valid === true);
            } catch {
                setTokenValide(false);
            } finally {
                setCheckingToken(false);
            }
        })();
    }, []);

    // ── Soumission ────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!allRulesOk) {
            Swal.fire({
                icon: "warning",
                title: "Mot de passe trop faible",
                text: "Veuillez respecter toutes les règles de sécurité.",
                confirmButtonColor: "#5DABA8",
            });
            return;
        }

        if (mdp !== mdpConfirm) {
            Swal.fire({
                icon: "warning",
                title: "Mots de passe différents",
                text: "Les deux mots de passe ne correspondent pas.",
                confirmButtonColor: "#5DABA8",
            });
            return;
        }

        setStatut("loading");

        try {
            const res  = await fetch(`${API_BASE}/reset-password`, {
                method:  "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body:    JSON.stringify({ token, mdp, mdp_confirm: mdpConfirm }),
            });

            const data = await res.json();

            if (data.success) {
                setStatut("success");
                Swal.fire({
                    icon: "success",
                    title: "Mot de passe modifié !",
                    text: "Votre mot de passe a été réinitialisé avec succès.",
                    confirmButtonColor: "#5DABA8",
                    confirmButtonText: "Se connecter",
                    allowOutsideClick: false,
                }).then(() => { window.location.href = "/connexion"; });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Erreur",
                    text: data.message || "Une erreur est survenue.",
                    confirmButtonColor: "#5DABA8",
                });
                if (res.status === 400 || res.status === 410) {
                    // Token invalide ou expiré
                    setTokenValide(false);
                }
                setStatut("idle");
            }
        } catch {
            Swal.fire({
                icon: "error",
                title: "Serveur inaccessible",
                text: "Impossible de contacter le serveur. Réessayez plus tard.",
                confirmButtonColor: "#5DABA8",
            });
            setStatut("idle");
        }
    };

    // ── Rendu ─────────────────────────────────────────────────────────────
    const renderContent = () => {

        // Vérification en cours
        if (checkingToken) {
            return (
                <div className="rp-state">
                    <div className="rp-spinner" aria-label="Vérification en cours" />
                    <p>Vérification du lien…</p>
                </div>
            );
        }

        // Token invalide / expiré
        if (tokenValide === false) {
            return (
                <div className="rp-state rp-state--error">
                    <div className="rp-icon rp-icon--error">⛔</div>
                    <h3>Lien invalide ou expiré</h3>
                    <p>Ce lien de réinitialisation n'est plus valide. Les liens expirent après 1 heure.</p>
                    <a href="/mdpoublie" className="cx-btn rp-btn-link">
                        Faire une nouvelle demande
                    </a>
                </div>
            );
        }

        // Formulaire
        return (
            <form onSubmit={handleSubmit} noValidate>
                {/* Nouveau mot de passe */}
                <div className="cx-input-wrap">
                    <input
                        type={showMdp ? "text" : "password"}
                        className="cx-input"
                        placeholder="Nouveau mot de passe"
                        value={mdp}
                        onChange={(e) => setMdp(e.target.value)}
                        required
                        disabled={statut === "loading"}
                        autoComplete="new-password"
                        aria-label="Nouveau mot de passe"
                    />
                    <span
                        className="cx-eye"
                        role="button"
                        tabIndex={0}
                        onClick={() => setShowMdp(v => !v)}
                        onKeyDown={(e) => e.key === "Enter" && setShowMdp(v => !v)}
                        aria-label={showMdp ? "Masquer" : "Afficher"}
                    >
                        {showMdp ? "🙈" : "👁️"}
                    </span>
                </div>

                {/* Indicateur de force */}
                {mdp.length > 0 && (
                    <ul className="rp-rules">
                        {Object.entries(rules).map(([key, ok]) => (
                            <li key={key} className={ok ? "rp-rule--ok" : "rp-rule--ko"}>
                                {ok ? "✔" : "✘"} {rulesLabels[key]}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Confirmation */}
                <div className="cx-input-wrap">
                    <input
                        type={showConfirm ? "text" : "password"}
                        className={`cx-input ${mdpConfirm && mdp !== mdpConfirm ? "cx-input--error" : ""}`}
                        placeholder="Confirmer le mot de passe"
                        value={mdpConfirm}
                        onChange={(e) => setMdpConfirm(e.target.value)}
                        required
                        disabled={statut === "loading"}
                        autoComplete="new-password"
                        aria-label="Confirmer le mot de passe"
                    />
                    <span
                        className="cx-eye"
                        role="button"
                        tabIndex={0}
                        onClick={() => setShowConfirm(v => !v)}
                        onKeyDown={(e) => e.key === "Enter" && setShowConfirm(v => !v)}
                        aria-label={showConfirm ? "Masquer" : "Afficher"}
                    >
                        {showConfirm ? "🙈" : "👁️"}
                    </span>
                </div>
                {mdpConfirm && mdp !== mdpConfirm && (
                    <p className="rp-mismatch">Les mots de passe ne correspondent pas.</p>
                )}

                <button
                    type="submit"
                    className="cx-btn"
                    disabled={statut === "loading" || !allRulesOk}
                    aria-busy={statut === "loading"}
                >
                    {statut === "loading" ? "Enregistrement…" : "Enregistrer le mot de passe"}
                </button>
            </form>
        );
    };

    return (
        <div className="cx-page">
            <div className="cx-topbar">
                <a href="/connexion" className="cx-topbar__back">← Connexion</a>
                <div className="cx-topbar__logo">
                    <img src={zenImg} alt="Zenselekt" />
                </div>
            </div>

            <div className="cx-card">
                <h2 className="cx-card__title">Nouveau mot de passe</h2>
                {renderContent()}
            </div>
        </div>
    );
}