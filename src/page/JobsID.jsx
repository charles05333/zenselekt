import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./css/jobid.css";
import zenImg from "../assets/img/zen.png";

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || '';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateFR(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function getTimeSincePublication(dateStr) {
  const diffDays  = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks > 0) return diffWeeks === 1 ? "Publiée depuis 1 semaine" : `Publiée depuis ${diffWeeks} semaines`;
  if (diffDays  > 0) return diffDays  === 1 ? "Publiée depuis 1 jour"    : `Publiée depuis ${diffDays} jours`;
  return "Publiée aujourd'hui";
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
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 3000);
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
    try { document.execCommand("copy"); showToast("Lien copié dans le presse-papier !"); }
    catch { showToast("Erreur lors de la copie."); }
    document.body.removeChild(textarea);
  }
}

// ─── Back to Top hook ─────────────────────────────────────────────────────────
function useBackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.pageYOffset > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return visible;
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function JobsID() {
  const { id } = useParams();

  const [job, setJob]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(""); // "", "invalid_id", "not_found", "server_error"

  const backToTopVisible = useBackToTop();

  useEffect(() => {
    // Validation côté client avant de faire la requête
    if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
      setError("invalid_id");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchJob = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/jobsID.php?id=${id}`, {
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (res.status === 404) { setError("not_found");    return; }
        if (res.status === 400) { setError("invalid_id");   return; }
        if (!res.ok)            { setError("server_error"); return; }

        const data = await res.json();
        if (!data.success || !data.job) { setError("not_found"); return; }
        setJob(data.job);
      } catch (err) {
        if (err.name === "AbortError") return; // navigation, pas une vraie erreur
        console.error("[JobsID] fetch error:", err);
        setError("server_error");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
    return () => controller.abort(); // nettoyage si le composant est démonté
  }, [id]);

  // URLs de partage (disponibles même pendant le chargement)
  const offreUrl    = `https://app.zenselekt.com/jobs/${id}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offreUrl)}`;
  const whatsappUrl = job
    ? `https://wa.me/?text=${encodeURIComponent("Découvrez cette offre d'emploi : " + job.titre + " - " + offreUrl)}`
    : "#";

  const expired = job ? isExpired(job.Date_lim_can) : false;

  // ─── États ────────────────────────────────────────────────────────────────
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
    return (
      <ErrorState
        icon="fas fa-exclamation-triangle"
        title="Paramètre invalide"
        message="L'identifiant de l'offre d'emploi est manquant ou invalide."
      />
    );
  }

  if (error === "not_found") {
    return (
      <ErrorState
        icon="fas fa-search"
        title="Offre introuvable"
        message="L'offre d'emploi demandée n'existe pas ou n'est plus disponible."
      />
    );
  }

  if (error === "server_error") {
    return (
      <ErrorState
        icon="fas fa-database"
        title="Erreur de connexion"
        message="Impossible de se connecter au serveur. Veuillez réessayer."
      />
    );
  }

  // ─── Rendu principal ──────────────────────────────────────────────────────
  return (
    <div className="jbid-page">
      <TopBar />
      <div className="jbid-container">
        <div className="jbid-layout">

          {/* ── Colonne principale ── */}
          <article className="jbid-details">
            <div className="jbid-header">
              <img src={zenImg} alt="Logo Zenselekt" className="jbid-logo" />
              <div className="jbid-header__info">
                <h1 className="jbid-title">{job.titre}</h1>
            

                {/* Partage */}
                <div className="jbid-share">
                  <span className="jbid-share__label">Partager :</span>
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                     className="jbid-share__btn jbid-share__btn--linkedin" title="Partager sur LinkedIn">
                    <i className="fab fa-linkedin-in" aria-hidden="true" />
                  </a>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                     className="jbid-share__btn jbid-share__btn--whatsapp" title="Partager sur WhatsApp">
                    <i className="fab fa-whatsapp" aria-hidden="true" />
                  </a>
                  <button onClick={() => copyToClipboard(offreUrl)}
                          className="jbid-share__btn jbid-share__btn--copy" title="Copier le lien">
                    <i className="fas fa-link" aria-hidden="true" />
                  </button>
                </div>

                {expired && (
                  <div className="jbid-expired-alert" role="alert">
                    <i className="fas fa-exclamation-triangle" aria-hidden="true" />
                    Cette offre a expiré le {formatDateFR(job.Date_lim_can)}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <section className="jbid-section">
              <h2>Description de l'offre</h2>
              <div
                className="jbid-section__content"
                dangerouslySetInnerHTML={{ __html: job.Description || "<p>Aucune description disponible.</p>" }}
              />
            </section>

            {/* Profil */}
            <section className="jbid-section">
              <h2>Profil recherché</h2>
              <div
                className="jbid-section__content"
                dangerouslySetInnerHTML={{ __html: job.Profil || "<p>Aucun profil renseigné.</p>" }}
              />
            </section>
          </article>

          {/* ── Sidebar ── */}
          <aside className="jbid-sidebar">
            <div className="jbid-sidebar__card">
              {/* Deadline */}
              <div className={`jbid-deadline ${expired ? "jbid-deadline--expired" : ""}`}>
                <i className={`fas ${expired ? "fa-times-circle" : "fa-clock"}`} aria-hidden="true" />
                {expired ? (
                  <>Candidatures fermées depuis le<br /><strong>{formatDateFR(job.Date_lim_can)}</strong></>
                ) : (
                  <>Candidatures ouvertes jusqu'au<br /><strong>{formatDateFR(job.Date_lim_can)}</strong></>
                )}
              </div>

              {/* Bouton postuler */}
              {!expired ? (
                <a href="/connexion" className="jbid-apply-btn">
                   Postuler maintenant
                </a>
              ) : (
                <button className="jbid-apply-btn jbid-apply-btn--disabled" disabled>
                  <i className="fas fa-lock" aria-hidden="true" /> Candidatures fermées
                </button>
              )}

              {/* Info grid */}
              <div className="jbid-info">
                <h3>
                  <i className="fas fa-info-circle" aria-hidden="true" /> Informations détaillées
                </h3>
                <div className="jbid-info__grid">
                  <InfoItem      label="Expérience requise" value={job.exp} />
                  <InfoItem  label="Qualifications"     value={job.quali} />
                  <InfoItem     label="Genre"              value={job.genre} />
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* Back to top */}
      <button
        className={`jbid-back-to-top ${backToTopVisible ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Retour en haut"
      >
        <i className="fas fa-arrow-up" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────
function TopBar() {
  return (
    <header className="jbid-topbar">
      <a href="/jobs" className="jbid-topbar__back" aria-label="Retour aux offres">
        <i className="fas fa-arrow-left" aria-hidden="true" />
        <span>Retour</span>
      </a>
      <img src={zenImg} alt="Zenselekt" className="jbid-topbar__logo" />
    </header>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="jbid-info__item">
      <div className="jbid-info__label">
        <i className={icon} aria-hidden="true" /> {label}
      </div>
      <div className="jbid-info__value">{value || "Non précisé"}</div>
    </div>
  );
}

function ErrorState({ icon, title, message }) {
  return (
    <div className="jbid-page">
      <TopBar />
      <div className="jbid-container">
        <div className="jbid-error" role="alert">
          <i className={icon} aria-hidden="true" />
          <h2>{title}</h2>
          <p>{message}</p>
          <a href="/jobs" className="jbid-error__back">
            <i className="fas fa-arrow-left" aria-hidden="true" /> Retour aux offres
          </a>
        </div>
      </div>
    </div>
  );
}