import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useSessionGuard } from "../auth/useSessionGuard.jsx";
import "./css/jobAuthid.css";
import zenImg from "../assets/img/zen.png";

// ─── Constantes ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || '';

const CARD_COLORS = [
  { bg: "#eeedfe", stroke: "#534ab7", icon: "rocket"    },
  { bg: "#faeeda", stroke: "#854f0b", icon: "chart"     },
  { bg: "#e6f1fb", stroke: "#185fa5", icon: "bar"       },
  { bg: "#fcebeb", stroke: "#a32d2d", icon: "users"     },
  { bg: "#f1efe8", stroke: "#5f5e5a", icon: "briefcase" },
  { bg: "#eaf3de", stroke: "#3b6d11", icon: "cog"       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateFR(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTimeSincePublication(dateStr) {
  if (!dateStr) return "";
  const pub = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - pub) / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks > 0)
    return diffWeeks === 1 ? "Il y a 1 semaine" : `Il y a ${diffWeeks} semaines`;
  if (diffDays > 0)
    return diffDays === 1 ? "Il y a 1 jour" : `Il y a ${diffDays} jours`;
  return "Aujourd'hui";
}

function isExpired(dateLim) {
  return new Date() > new Date(dateLim);
}

function showToast(message) {
  const existing = document.querySelector(".jbid-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "jbid-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function copyToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast("Lien copié dans le presse-papier !");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showToast("Lien copié dans le presse-papier !");
    } catch {
      showToast("Erreur lors de la copie.");
    }
    document.body.removeChild(textarea);
  }
}

// ─── Back to Top ──────────────────────────────────────────────────────────────
function useBackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.pageYOffset > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return visible;
}

// ─── Icônes inline ────────────────────────────────────────────────────────────
function IconSVG({ name, stroke }) {
  const s = { fill: "none", stroke, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "briefcase") return (
    <svg viewBox="0 0 24 24" style={s}>
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  );
  if (name === "chart") return (
    <svg viewBox="0 0 24 24" style={s}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
  if (name === "bar") return (
    <svg viewBox="0 0 24 24" style={s}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  );
  if (name === "users") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  if (name === "cog") return (
    <svg viewBox="0 0 24 24" style={s}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
  if (name === "rocket") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    </svg>
  );
  return null;
}

function InlineIcon({ name }) {
  const s = { fill: "none", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "briefcase") return (
    <svg viewBox="0 0 24 24" style={s}>
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  );
  if (name === "calendar") return (
    <svg viewBox="0 0 24 24" style={s}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  );
  if (name === "clock") return (
    <svg viewBox="0 0 24 24" style={s}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  if (name === "user") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
  if (name === "graduation") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
  if (name === "tag") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
  if (name === "linkedin") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
  if (name === "whatsapp") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  );
  if (name === "link") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
  if (name === "send") return (
    <svg viewBox="0 0 24 24" style={s}>
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
  if (name === "lock") return (
    <svg viewBox="0 0 24 24" style={s}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
  if (name === "arrow-left") return (
    <svg viewBox="0 0 24 24" style={s}>
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  );
  if (name === "arrow-up") return (
    <svg viewBox="0 0 24 24" style={s}>
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>
  );
  if (name === "file") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
  if (name === "alert") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  // ── NOUVEAU : icône check ──────────────────────────────────────────────────
  if (name === "check") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
  return null;
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function JobsAuthID() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { session, loading: sessionLoading, logout } = useSessionGuard({
    redirectTo: "/connexion",
    checkInterval: 5 * 60 * 1000,
  });

  const [job, setJob]                   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [postulerLoading, setPostulerLoading] = useState(false);
  // ── NOUVEAU ──────────────────────────────────────────────────────────────────
  const [dejaPostule, setDejaPostule]   = useState(false);
  // ─────────────────────────────────────────────────────────────────────────────
  const backToTopVisible = useBackToTop();

  useEffect(() => {
    if (sessionLoading) return;

    if (!id || isNaN(id) || Number(id) <= 0) {
      setError("invalid_id");
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${API_BASE}/jobsID.php?id=${id}`, {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Authorization": `Bearer ${token}`,
          },
          credentials: "same-origin",
        });

        if (res.status === 401) { logout(); return; }
        if (res.status === 404) { setError("not_found");   return; }
        if (res.status === 400) { setError("invalid_id");  return; }
        if (!res.ok)            { setError("server_error"); return; }

        const data = await res.json();
        if (!data.success || !data.job) { setError("not_found"); return; }

        setJob(data.job);

        // ── NOUVEAU : si jobsID.php renvoie already_applied on le lit ──────────
        if (data.already_applied === true) {
          setDejaPostule(true);
        }
        // ───────────────────────────────────────────────────────────────────────

      } catch (err) {
        console.error("[JobsAuthID] fetch error:", err);
        setError("server_error");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, sessionLoading, logout]);

  const handlePostuler = async () => {
  if (!session) {
    Swal.fire({
      icon: "warning",
      title: "Connexion requise",
      text: "Veuillez vous connecter pour postuler à cette offre.",
      confirmButtonText: "Se connecter",
      confirmButtonColor: "#0d6e5e",
    }).then((result) => {
      if (result.isConfirmed) navigate("/connexion");
    });
    return;
  }

  setPostulerLoading(true);
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/postuler.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ offre_id: job.id }),
    });

    if (res.status === 401) { logout(); return; }

    // ── Lire le texte brut d'abord pour détecter les réponses malformées ──
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Réponse non-JSON (erreur serveur PHP, etc.)
      // Si la candidature était peut-être enregistrée, on vérifie le statut HTTP
      if (res.ok) {
        // 200 mais JSON cassé → on considère succès et on redirige
        setDejaPostule(true);
        Swal.fire({
          icon: "success",
          title: "Candidature envoyée !",
          text: "Votre candidature a été envoyée avec succès.",
          confirmButtonText: "Voir mes candidatures",
          confirmButtonColor: "#0d6e5e",
          timer: 2000,
          timerProgressBar: true,
          willClose: () => navigate("/candidatures"),
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Une erreur est survenue. Veuillez réessayer.",
          confirmButtonText: "Fermer",
          confirmButtonColor: "#e53935",
        });
      }
      return;
    }

    if (data.success) {
      setDejaPostule(true);
      Swal.fire({
        icon: "success",
        title: "Candidature envoyée !",
        text: data.message || "Votre candidature a été envoyée avec succès.",
        confirmButtonText: "Voir mes candidatures",
        confirmButtonColor: "#0d6e5e",
        timer: 2000,
        timerProgressBar: true,
        willClose: () => navigate("/candidatures"),
      });
    } else if (res.status === 409) {
      setDejaPostule(true);
      Swal.fire({
        icon: "info",
        title: "Déjà postulé",
        text: data.message || "Vous avez déjà postulé à cette offre.",
        confirmButtonText: "Voir mes candidatures",
        confirmButtonColor: "#0d6e5e",
      }).then((result) => {
        if (result.isConfirmed) navigate("/candidatures");
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: data.message || "Une erreur est survenue lors de l'envoi de votre candidature.",
        confirmButtonText: "Fermer",
        confirmButtonColor: "#e53935",
      });
    }
  } catch (err) {
    console.error("[JobsAuthID] postuler error:", err);
    Swal.fire({
      icon: "error",
      title: "Erreur réseau",
      text: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
      confirmButtonText: "Fermer",
      confirmButtonColor: "#e53935",
    });
  } finally {
    setPostulerLoading(false);
  }
};
  const offreUrl    = `https://app.zenselekt.com/jobs-auth/${id}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offreUrl)}`;
  const whatsappUrl = job
    ? `https://wa.me/?text=${encodeURIComponent("Découvrez cette offre d'emploi : " + job.titre + " - " + offreUrl)}`
    : "#";

  const expired     = job ? isExpired(job.Date_lim_can) : false;
  const colorIndex  = job ? (job.id - 1) % CARD_COLORS.length : 0;
  const color       = CARD_COLORS[colorIndex];

  // ─── Rendus de chargement / erreur ───────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="ins-spinner" aria-label="Chargement…" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="jbid-page">
        <TopBar />
        <div className="jbid-container">
          <div className="jbid-skeleton">
            <div className="jbid-skeleton__title" />
            <div className="jbid-skeleton__line" />
            <div className="jbid-skeleton__line jbid-skeleton__line--short" />
          </div>
        </div>
      </div>
    );
  }

  if (error === "invalid_id") {
    return <ErrorState icon="alert" title="Paramètre invalide" message="L'identifiant de l'offre d'emploi est manquant ou invalide." />;
  }
  if (error === "not_found") {
    return <ErrorState icon="alert" title="Offre introuvable" message="L'offre d'emploi demandée n'existe pas ou n'est plus disponible." />;
  }
  if (error === "server_error") {
    return <ErrorState icon="alert" title="Erreur de connexion" message="Impossible de se connecter au serveur. Veuillez réessayer." />;
  }

  // ─── Rendu principal ─────────────────────────────────────────────────────────
  return (
    <div className="jbid-page">
      <TopBar />
      <div className="jbid-container">
        <div className="jbid-layout">

          {/* Colonne gauche */}
          <div className="jbid-left">
            <div className="jbid-job-card">
              <h1 className="jbid-card-title">{job.titre}</h1>
            </div>

            <div className="jbid-section">
              <h2 className="jbid-section-title">Description de l'offre</h2>
              <div
                className="jbid-section-content"
                dangerouslySetInnerHTML={{ __html: job.Description || "<p>Aucune description disponible.</p>" }}
              />
            </div>

            <div className="jbid-section">
              <h2 className="jbid-section-title">Profil recherché</h2>
              <div
                className="jbid-section-content"
                dangerouslySetInnerHTML={{ __html: job.Profil || "<p>Aucun profil renseigné.</p>" }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="jbid-sidebar">
            <div className="jbid-sidebar-card">
              <div className={`jbid-deadline-banner${expired ? " jbid-deadline-banner--expired" : ""}`}>
                <span className="jbid-deadline-label">
                  {expired ? "Candidatures fermées depuis le" : "Candidatures ouvertes jusqu'au"}
                </span>
                <strong className="jbid-deadline-date">{formatDateFR(job.Date_lim_can)}</strong>
              </div>

              {/* ── NOUVEAU : trois états du bouton ─────────────────────────── */}
              {dejaPostule ? (
                <div className="jbid-already-applied">
                  <InlineIcon name="check" />
                  Vous avez déjà postulé
                </div>
              ) : !expired ? (
                <button
                  className="jbid-apply-btn"
                  onClick={handlePostuler}
                  disabled={postulerLoading}
                >
                  {postulerLoading ? "Envoi en cours..." : "Postuler maintenant"}
                </button>
              ) : (
                <button className="jbid-apply-btn jbid-apply-btn--disabled" disabled>
                  <InlineIcon name="lock" />
                  Candidatures fermées
                </button>
              )}
              {/* ─────────────────────────────────────────────────────────────── */}

              <div className="jbid-info">
                <h3 className="jbid-info-title">Informations détaillées</h3>
                <div className="jbid-info-grid">
                  <InfoItem icon="user"       label="Expérience requise" value={job.exp}   />
                  <InfoItem icon="graduation" label="Qualification"       value={job.quali} />
                  <InfoItem icon="tag"        label="Type de contrat"     value={job.type}  />
                  {job.genre && job.genre !== "Homme/Femme" && (
                    <InfoItem icon="user" label="Genre" value={job.genre} />
                  )}
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      <button
        className={`jbid-back-to-top${backToTopVisible ? " visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Retour en haut"
      >
        <InlineIcon name="arrow-up" />
      </button>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────
function TopBar() {
  return (
    <header className="jbid-topbar">
      <a href="/jobs-auth" className="jbid-topbar-back" aria-label="Retour aux offres">
        <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }}>
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Retour aux offres</span>
      </a>
      <img src={zenImg} alt="Logo Zenselekt" className="jbid-topbar-logo" />
    </header>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="jbid-info-item">
      <span className="jbid-info-item-label">
        <InlineIcon name={icon} />
        {label}
      </span>
      <span className="jbid-info-item-value">{value || "Non précisé"}</span>
    </div>
  );
}

function ErrorState({ icon, title, message }) {
  return (
    <div className="jbid-page">
      <TopBar />
      <div className="jbid-container">
        <div className="jbid-error" role="alert">
          <div className="jbid-error-icon">
            <InlineIcon name={icon} />
          </div>
          <h2>{title}</h2>
          <p>{message}</p>
          <a href="/jobs-auth" className="jbid-error-back">
            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }}>
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Retour aux offres
          </a>
        </div>
      </div>
    </div>
  );
}