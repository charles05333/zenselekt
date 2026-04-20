import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // ✅ useParams au lieu de useSearchParams
import "./css/jobid.css";
import zenImg from "../assets/img/zen.png";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateFR(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getTimeSincePublication(dateStr) {
  const pub = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - pub) / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks > 0)
    return diffWeeks === 1 ? "Publiée depuis 1 semaine" : `Publiée depuis ${diffWeeks} semaines`;
  if (diffDays > 0)
    return diffDays === 1 ? "Publiée depuis 1 jour" : `Publiée depuis ${diffDays} jours`;
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

// ─── Root Component ───────────────────────────────────────────────────────────
export default function JobsID() {
  // ✅ CORRECTION : useParams() lit l'ID depuis /jobs/:id
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backToTopVisible = useBackToTop();

  useEffect(() => {
    if (!id || isNaN(id) || Number(id) <= 0) {
      setError("invalid_id");
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      setLoading(true);
      setError("");
      try {
        // 🔌 Vrai appel API :
        // const res = await fetch(`/jobsID.php?id=${id}`, {
        //   headers: { "X-Requested-With": "XMLHttpRequest" },
        //   credentials: "same-origin",
        // });
        // if (!res.ok) throw new Error("Erreur serveur");
        // const data = await res.json();
        // if (!data.job) { setError("not_found"); return; }
        // setJob(data.job);

        // Simulation :
        await new Promise((r) => setTimeout(r, 700));
        const MOCK_JOBS = {
          1: {
            id: 1,
            titre: "Développeur Full Stack React / Node.js",
            entreprise: "TechCorp CI",
            Date_pub: "2025-04-01",
            Date_lim_can: "2025-06-30",
            exp: "2 ans",
            quali: "Licence / Bachelor",
            genre: "Homme/Femme",
            Description: `<p>Nous recherchons un développeur Full Stack passionné pour rejoindre notre équipe dynamique.</p>
              <ul>
                <li>Développement et maintenance d'applications web modernes</li>
                <li>Collaboration étroite avec les équipes Design et Produit</li>
                <li>Participation aux revues de code et à l'amélioration continue</li>
              </ul>`,
            Profil: `<p>Vous êtes le candidat idéal si vous avez :</p>
              <ul>
                <li>Une maîtrise de React.js et Node.js</li>
                <li>Une expérience avec les bases de données SQL/NoSQL</li>
                <li>Une bonne communication et esprit d'équipe</li>
              </ul>`,
          },
          2: {
            id: 2,
            titre: "Responsable Ressources Humaines",
            entreprise: "Groupe Bolloré",
            Date_pub: "2025-03-20",
            Date_lim_can: "2025-05-31",
            exp: "5 ans",
            quali: "Master / MBA",
            genre: "Femme",
            Description: `<p>Poste de RH senior pour piloter la politique ressources humaines du groupe.</p>
              <ul>
                <li>Gestion du recrutement et de l'intégration</li>
                <li>Pilotage des plans de formation</li>
                <li>Suivi des indicateurs RH</li>
              </ul>`,
            Profil: `<p>Profil recherché :</p>
              <ul>
                <li>Expérience confirmée en gestion des RH</li>
                <li>Excellente maîtrise du droit du travail ivoirien</li>
                <li>Leadership et sens de la diplomatie</li>
              </ul>`,
          },
          3: {
            id: 3,
            titre: "Comptable Senior",
            entreprise: "Cabinet Expertise",
            Date_pub: "2025-04-10",
            Date_lim_can: "2025-07-15",
            exp: "3 ans",
            quali: "Licence",
            genre: "Homme/Femme",
            Description: `<p>Nous cherchons un comptable senior rigoureux pour rejoindre notre cabinet.</p>
              <ul>
                <li>Tenue de la comptabilité générale et analytique</li>
                <li>Préparation des bilans et déclarations fiscales</li>
                <li>Supervision d'une équipe de 2 comptables juniors</li>
              </ul>`,
            Profil: `<p>Profil attendu :</p>
              <ul>
                <li>Maîtrise des logiciels comptables (SAGE, etc.)</li>
                <li>Connaissance du droit fiscal ivoirien</li>
                <li>Rigueur, autonomie et sens de l'organisation</li>
              </ul>`,
          },
        };

        const found = MOCK_JOBS[Number(id)];
        if (!found) {
          setError("not_found");
        } else {
          setJob(found);
        }
      } catch {
        setError("server_error");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // ✅ BONUS : offreUrl pointe vers la route React (pas vers JobsID.php)
  const offreUrl    = `https://zenselekt.com/jobs/${id}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offreUrl)}`;
  const whatsappUrl = job
    ? `https://wa.me/?text=${encodeURIComponent(
        "Découvrez cette offre d'emploi : " + job.titre + " - " + offreUrl
      )}`
    : "#";

  const expired = job ? isExpired(job.Date_lim_can) : false;

  // ─── States ────────────────────────────────────────────────────────────────
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

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="jbid-page">
      <TopBar />
      <div className="jbid-container">
        <div className="jbid-layout">
          {/* ── Left column ── */}
          <article className="jbid-details">
            {/* Header */}
            <div className="jbid-header">
              <img src={zenImg} alt="Logo Zenselekt" className="jbid-logo" />
              <div className="jbid-header__info">
                <h1 className="jbid-title">{job.titre}</h1>
                {job.entreprise && (
                  <p className="jbid-company">
                    <i className="fas fa-building" aria-hidden="true" /> {job.entreprise}
                  </p>
                )}
                <p className="jbid-pub-date">
                  <i className="fas fa-clock" aria-hidden="true" />{" "}
                  {getTimeSincePublication(job.Date_pub)}
                </p>

                {/* Share */}
                <div className="jbid-share">
                  <span className="jbid-share__label">Partager :</span>
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jbid-share__btn jbid-share__btn--linkedin"
                    title="Partager sur LinkedIn"
                  >
                    <i className="fab fa-linkedin-in" aria-hidden="true" />
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jbid-share__btn jbid-share__btn--whatsapp"
                    title="Partager sur WhatsApp"
                  >
                    <i className="fab fa-whatsapp" aria-hidden="true" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(offreUrl)}
                    className="jbid-share__btn jbid-share__btn--copy"
                    title="Copier le lien"
                  >
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
              <h2>
                <i className="fas fa-briefcase" aria-hidden="true" /> Description de l'offre
              </h2>
              <div
                className="jbid-section__content"
                dangerouslySetInnerHTML={{ __html: job.Description }}
              />
            </section>

            {/* Profil */}
            <section className="jbid-section">
              <h2>
                <i className="fas fa-user-check" aria-hidden="true" /> Profil recherché
              </h2>
              <div
                className="jbid-section__content"
                dangerouslySetInnerHTML={{ __html: job.Profil }}
              />
            </section>
          </article>

          {/* ── Sidebar ── */}
          <aside className="jbid-sidebar">
            <div className="jbid-sidebar__card">
              {/* Deadline */}
              <div className={`jbid-deadline ${expired ? "jbid-deadline--expired" : ""}`}>
                <i
                  className={`fas ${expired ? "fa-times-circle" : "fa-clock"}`}
                  aria-hidden="true"
                />
                {expired ? (
                  <>
                    Candidatures fermées depuis le
                    <br />
                    <strong>{formatDateFR(job.Date_lim_can)}</strong>
                  </>
                ) : (
                  <>
                    Candidatures ouvertes jusqu'au
                    <br />
                    <strong>{formatDateFR(job.Date_lim_can)}</strong>
                  </>
                )}
              </div>

              {/* Apply button */}
              {!expired ? (
                <a href="/connexion" className="jbid-apply-btn">
                  <i className="fas fa-paper-plane" aria-hidden="true" /> Postuler maintenant
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
                  <InfoItem icon="fas fa-user-tie"       label="Expérience requise" value={job.exp} />
                  <InfoItem icon="fas fa-graduation-cap" label="Qualifications"     value={job.quali} />
                  <InfoItem icon="fas fa-venus-mars"     label="Genre"              value={job.genre} />
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

// ─── Sub-components ───────────────────────────────────────────────────────────
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