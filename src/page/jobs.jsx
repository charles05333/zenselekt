import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/jobs.css";
import zenImg from "../assets/img/zen.png";

// ─── Constants ────────────────────────────────────────────────────────────────
const EXPERIENCE_OPTIONS = [
  { value: "Aucune", label: "Débutant - Aucune expérience" },
  { value: "1an",    label: "1 An d'expérience" },
  { value: "2ans",   label: "2 Ans d'expérience" },
  { value: "3ans",   label: "3 Ans d'expérience" },
  { value: "4ans",   label: "4 Ans d'expérience" },
  { value: "5ans",   label: "5 Ans d'expérience" },
  { value: "6ans",   label: "6 Ans d'expérience" },
  { value: "7ans",   label: "7 Ans d'expérience" },
  { value: "8ans",   label: "8 Ans d'expérience" },
  { value: "9ans",   label: "9 Ans d'expérience" },
  { value: "10ans",  label: "10+ Ans d'expérience" },
];

const QUALIFICATION_OPTIONS = [
  { value: "Certificat", label: "Certificat Professionnel" },
  { value: "BAC",        label: "Baccalauréat" },
  { value: "BTS",        label: "BTS / DUT" },
  { value: "Licence",    label: "Licence / Bachelor" },
  { value: "Ingénieur",  label: "Diplôme d'Ingénieur" },
  { value: "Master",     label: "Master / MBA" },
  { value: "Doctorat",   label: "Doctorat" },
  { value: "PHD",        label: "PhD" },
];

const GENRE_OPTIONS = [
  { value: "homme",       label: "Homme" },
  { value: "femme",       label: "Femme" },
  { value: "Homme/Femme", label: "Homme/Femme" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
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

function formatDateFR(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function showToast(message) {
  const existing = document.querySelector(".jb-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "jb-toast";
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
    showToast("Erreur lors de la copie.");
  }
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, index }) {
  const navigate = useNavigate();

  // URL canonique pour le partage (lien public)
  const offreUrl    = `https://zenselekt.com/jobs/${job.id}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offreUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    "Découvrez cette offre d'emploi : " + job.titre + " - " + offreUrl
  )}`;

  const handleCardClick = (e) => {
    if (e.target.closest(".jb-card__share")) return;
    navigate(`/jobs/${job.id}`);
  };

  return (
    <div
      className="jb-card fade-in"
      style={{ animationDelay: `${index * 0.08}s`, cursor: "pointer" }}
      onClick={handleCardClick}
      role="article"
    >
      <div className="jb-card__header">
        <div className="jb-card__info">
          <a
            className="jb-card__title"
            href={`/jobs/${job.id}`}
            onClick={(e) => { e.preventDefault(); navigate(`/jobs/${job.id}`); }}
          >
            {job.titre}
          </a>
          {job.entreprise && (
            <p className="jb-card__company">
              <i className="fas fa-building" aria-hidden="true" /> {job.entreprise}
            </p>
          )}
        </div>
      </div>

      <div className="jb-card__tags">
        <span className="jb-tag jb-tag--time">
          <i className="fas fa-clock" aria-hidden="true" /> {timeAgo(job.Date_pub)}
        </span>
        <span className="jb-tag jb-tag--deadline">
          <i className="fas fa-calendar-alt" aria-hidden="true" /> Limite : {formatDateFR(job.Date_lim_can)}
        </span>
        {job.exp && (
          <span className="jb-tag">
            <i className="fas fa-user-tie" aria-hidden="true" /> {job.exp}
          </span>
        )}
        {job.quali && (
          <span className="jb-tag">
            <i className="fas fa-graduation-cap" aria-hidden="true" /> {job.quali}
          </span>
        )}
        {job.genre && job.genre !== "Homme/Femme" && (
          <span className="jb-tag">
            <i className="fas fa-venus-mars" aria-hidden="true" /> {job.genre}
          </span>
        )}
      </div>

      <div className="jb-card__share">
        <span className="jb-share-label">Partager :</span>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="jb-share-btn jb-share-btn--linkedin"
          title="Partager sur LinkedIn"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fab fa-linkedin-in" aria-hidden="true" />
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="jb-share-btn jb-share-btn--whatsapp"
          title="Partager sur WhatsApp"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fab fa-whatsapp" aria-hidden="true" />
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); copyToClipboard(offreUrl); }}
          className="jb-share-btn jb-share-btn--copy"
          title="Copier le lien"
        >
          <i className="fas fa-link" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Filter Section ───────────────────────────────────────────────────────────
function FilterSection({ filters, onChange, onSubmit, onReset }) {
  return (
    <section className="jb-filters">
      <div className="jb-filters__grid">
        <div className="jb-filter-group">
          <label className="jb-filter-label" htmlFor="jb-exp">
            <i className="fas fa-user-clock" aria-hidden="true" /> Expérience requise
          </label>
          <select
            id="jb-exp"
            className="jb-select"
            value={filters.exp}
            onChange={(e) => onChange("exp", e.target.value)}
          >
            <option value="">Toute expérience</option>
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="jb-filter-group">
          <label className="jb-filter-label" htmlFor="jb-quali">
            <i className="fas fa-graduation-cap" aria-hidden="true" /> Niveau d'études
          </label>
          <select
            id="jb-quali"
            className="jb-select"
            value={filters.quali}
            onChange={(e) => onChange("quali", e.target.value)}
          >
            <option value="">Toute qualification</option>
            {QUALIFICATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="jb-filter-group">
          <label className="jb-filter-label" htmlFor="jb-genre">
            <i className="fas fa-users" aria-hidden="true" /> Profil recherché
          </label>
          <select
            id="jb-genre"
            className="jb-select"
            value={filters.genre}
            onChange={(e) => onChange("genre", e.target.value)}
          >
            <option value="">Indifférent</option>
            {GENRE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="jb-filters__actions">
        <button className="jb-btn jb-btn--primary" onClick={onSubmit}>
          <i className="fas fa-search" aria-hidden="true" /> Rechercher les offres
        </button>
        <button className="jb-btn jb-btn--secondary" onClick={onReset}>
          <i className="fas fa-undo" aria-hidden="true" /> Réinitialiser les filtres
        </button>
      </div>
    </section>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function Jobs() {
  const [filters, setFilters] = useState({ exp: "", quali: "", genre: "" });
  const [applied, setApplied] = useState({ exp: "", quali: "", genre: "" });
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const fetchJobs = async (activeFilters) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (activeFilters.exp)   params.set("exp",   activeFilters.exp);
      if (activeFilters.quali) params.set("quali",  activeFilters.quali);
      if (activeFilters.genre) params.set("genre",  activeFilters.genre);

      // 🔌 Vrai appel API :
      // const res = await fetch(`/jobs.php?${params.toString()}`, {
      //   headers: { "X-Requested-With": "XMLHttpRequest" },
      //   credentials: "same-origin",
      // });
      // if (!res.ok) throw new Error("Erreur serveur");
      // const data = await res.json();
      // setJobs(data.jobs || []);

      // Simulation :
      await new Promise((r) => setTimeout(r, 800));
      setJobs([
        {
          id: 1,
          titre: "Développeur Full Stack React / Node.js",
          entreprise: "TechCorp CI",
          Date_pub: "2025-04-01",
          Date_lim_can: "2025-06-30",
          exp: "2ans",
          quali: "Licence",
          genre: "Homme/Femme",
        },
        {
          id: 2,
          titre: "Responsable Ressources Humaines",
          entreprise: "Groupe Bolloré",
          Date_pub: "2025-03-20",
          Date_lim_can: "2025-05-31",
          exp: "5ans",
          quali: "Master",
          genre: "femme",
        },
        {
          id: 3,
          titre: "Comptable Senior",
          entreprise: "Cabinet Expertise",
          Date_pub: "2025-04-10",
          Date_lim_can: "2025-07-15",
          exp: "3ans",
          quali: "Licence",
          genre: "Homme/Femme",
        },
      ]);
    } catch {
      setError("Impossible de charger les offres. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(applied);
  }, [applied]);

  const handleSubmit = () => setApplied({ ...filters });
  const handleReset  = () => {
    setFilters({ exp: "", quali: "", genre: "" });
    setApplied({ exp: "", quali: "", genre: "" });
  };

  return (
    <div className="jb-page">
      {/* Top bar */}
      <header className="jb-topbar">
        <a href="/" className="jb-topbar__back" aria-label="Retour à l'accueil">
          <i className="fas fa-arrow-left" aria-hidden="true" />
          <span>Retour à l'accueil</span>
        </a>
        <img src={zenImg} alt="Zenselekt" className="jb-topbar__logo" />
      </header>

      <main className="jb-container">
        {/* Hero */}
        <div className="jb-hero">
          <h1>Trouvez Votre Emploi Idéal</h1>
          <p>
            Découvrez des opportunités de carrière exceptionnelles avec nos filtres
            de recherche avancés
          </p>
        </div>

        {/* Filters */}
        <FilterSection
          filters={filters}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />

        {/* Results */}
        <section className="jb-results">
          <div className="jb-results__header">
            <span className="jb-results__count">
              {loading
                ? "Chargement…"
                : `${jobs.length} offre${jobs.length > 1 ? "s" : ""} trouvée${jobs.length > 1 ? "s" : ""}`}
            </span>
          </div>

          {error && (
            <p className="jb-error" role="alert">
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {error}
            </p>
          )}

          {!loading && jobs.length === 0 && !error && (
            <div className="jb-empty">
              <i className="fas fa-search-minus" aria-hidden="true" />
              <h3>Aucune offre trouvée</h3>
              <p>
                Essayez de modifier vos critères de recherche pour découvrir plus
                d'opportunités.
              </p>
            </div>
          )}

          {jobs.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} />
          ))}
        </section>
      </main>
    </div>
  );
}