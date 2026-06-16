import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Menu from "./Menu";
import { useSessionGuard } from "../auth/useSessionGuard.jsx";
import { CompatibilityBadge } from "../auth/useCompatibility.jsx";
import "./css/jobsAuth.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || '';

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Toute expérience" },
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
  { value: "", label: "Toute qualification" },
  { value: "Certificat", label: "Certificat Professionnel" },
  { value: "BAC",        label: "Baccalauréat" },
  { value: "BTS",        label: "BTS / DUT" },
  { value: "Licence",    label: "Licence / Bachelor" },
  { value: "Ingénieur",  label: "Diplôme d'Ingénieur" },
  { value: "Master",     label: "Master / MBA" },
  { value: "Doctorat",   label: "Doctorat" },
  { value: "PHD",        label: "PhD" },
];

const TYPE_OPTIONS = [
  { value: "",             label: "Tous les types" },
  { value: "CDI",          label: "CDI" },
  { value: "CDD",          label: "CDD" },
  { value: "Stage",        label: "Stage" },
  { value: "Alternance",   label: "Alternance" },
  { value: "Freelance",    label: "Freelance" },
  { value: "Temps partiel",label: "Temps partiel" },
  { value: "Intérim",      label: "Intérim" },
  { value: "Bénévolat",    label: "Bénévolat" },
];

const CARD_COLORS = [
  { bg: "#eeedfe", stroke: "#534ab7", icon: "rocket"    },
  { bg: "#faeeda", stroke: "#854f0b", icon: "chart"     },
  { bg: "#e6f1fb", stroke: "#185fa5", icon: "bar"       },
  { bg: "#fcebeb", stroke: "#a32d2d", icon: "users"     },
  { bg: "#f1efe8", stroke: "#5f5e5a", icon: "briefcase" },
  { bg: "#eaf3de", stroke: "#3b6d11", icon: "cog"       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const pub = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - pub) / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks > 0) return diffWeeks === 1 ? "Il y a 1 semaine" : `Il y a ${diffWeeks} semaines`;
  if (diffDays > 0)  return diffDays  === 1 ? "Il y a 1 jour"    : `Il y a ${diffDays} jours`;
  return "Aujourd'hui";
}

function formatDateFR(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
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
  if (name === "mappin") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
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
  if (name === "x") return (
    <svg viewBox="0 0 24 24" style={s}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6"  y1="6" x2="18" y2="18"/>
    </svg>
  );
  if (name === "eye") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
  if (name === "filter") return (
    <svg viewBox="0 0 24 24" style={s}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
  if (name === "search") return (
    <svg viewBox="0 0 24 24" style={s}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  if (name === "list") return (
    <svg viewBox="0 0 24 24" style={s}>
      <line x1="8" y1="6"  x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6"  x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
  if (name === "grid2") return (
    <svg viewBox="0 0 24 24" style={s}>
      <rect x="3"  y="3"  width="7" height="7"/>
      <rect x="14" y="3"  width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3"  y="14" width="7" height="7"/>
    </svg>
  );
  if (name === "share") return (
    <svg viewBox="0 0 24 24" style={s}>
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6"  cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
    </svg>
  );
  if (name === "graduation") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
  if (name === "user") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
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
  if (name === "check") return (
    <svg viewBox="0 0 24 24" style={s}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  if (name === "tag") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
  if (name === "sparkle") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M12 3c0 4.5-3.5 8-8 9 4.5 1 8 4.5 8 9 0-4.5 3.5-8 8-9-4.5-1-8-4.5-8-9z"/>
    </svg>
  );
  return null;
}

// ─── Modal détail offre ───────────────────────────────────────────────────────
function DetailModal({ job, onClose, colorIndex, token }) {
  const navigate = useNavigate();

  const offreUrl    = `https://app.zenselekt.com/jobs-auth/${job.id}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offreUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent("Découvrez cette offre d'emploi : " + job.titre + " - " + offreUrl)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(offreUrl);
      Swal.fire({
        icon: "success",
        title: "Lien copié !",
        text: "Le lien a été copié dans votre presse-papiers.",
        timer: 2500,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
        customClass: { popup: "swal-toast-custom" },
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de copier le lien.",
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "bottom-end",
      });
    }
  }

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="jb-modal-overlay" onClick={onClose}>
      <div className="jb-modal" onClick={e => e.stopPropagation()}>
        <button className="jb-modal-close" onClick={onClose}>
          <InlineIcon name="x" />
        </button>

        <div className="jb-modal-header">
          <div>
            <h2 className="jb-modal-title">{job.titre}</h2>
            <p className="jb-modal-company">{job.entreprise}</p>
          </div>
        </div>

        {/* Score IA dans la modal */}
        <div className="jb-modal-compat">
         
          <CompatibilityBadge jobId={job.id} token={token} />
        </div>

        <div className="jb-modal-meta">
          <span className="jb-modal-meta-item">{timeAgo(job.Date_pub)}</span>
          {job.type && (
            <span className="jb-modal-meta-item jb-modal-meta-item--type">{job.type}</span>
          )}
          <span className="jb-modal-meta-item jb-modal-meta-item--deadline">
            Limite : {formatDateFR(job.Date_lim_can)}
          </span>
        </div>

        <div className="jb-modal-tags">
          {job.exp && (
            <span className="jb-modal-tag">
             
              {job.exp}
            </span>
          )}
          {job.quali && (
            <span className="jb-modal-tag">
              
              {job.quali}
            </span>
          )}
          {job.genre && job.genre !== "Homme/Femme" && (
            <span className="jb-modal-tag">
             
              {job.genre}
            </span>
          )}
        </div>

        <div className="jb-modal-share">
          <span className="jb-modal-share-label">Partager :</span>
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="jb-modal-share-btn jb-modal-share-btn--linkedin" title="LinkedIn">
            <InlineIcon name="linkedin" />
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="jb-modal-share-btn jb-modal-share-btn--whatsapp" title="WhatsApp">
            <InlineIcon name="whatsapp" />
          </a>
          <button onClick={handleCopy} className="jb-modal-share-btn jb-modal-share-btn--copy" title="Copier le lien">
            <InlineIcon name="link" />
          </button>
        </div>

        <div className="jb-modal-footer">
          <button className="jb-modal-btn jb-modal-btn--secondary" onClick={onClose}>Fermer</button>
          <button className="jb-modal-btn jb-modal-btn--primary" onClick={() => navigate(`/jobs-auth/${job.id}`)}>
            Voir l'offre complète
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function JobsAuth() {
  const { session, loading: sessionLoading, logout } = useSessionGuard({
    redirectTo: "/connexion",
    checkInterval: 5 * 60 * 1000,
  });

  // Token Bearer extrait de la session
  // Adapte "session.token" selon ce qu'expose ton useSessionGuard
const token = localStorage.getItem("token") || null;

  const [search, setSearch]         = useState("");
  const [filterExp, setFilterExp]   = useState("");
  const [filterQuali, setFilterQuali] = useState("");
  const [filterType, setFilterType] = useState("");
  const [viewMode, setViewMode]     = useState("grid");
  const [visible, setVisible]       = useState([]);
  const [selected, setSelected]     = useState(null);

  const [jobs, setJobs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  // Chargement des offres
  useEffect(() => {
    if (sessionLoading) return;

    const fetchJobs = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (filterExp)   params.set("exp",   filterExp);
        if (filterQuali) params.set("quali", filterQuali);

        const res = await fetch(`${API_BASE}/jobs.php?${params.toString()}`, {
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "same-origin",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Erreur API");

        let jobsData = data.jobs || [];
        if (filterType) {
          jobsData = jobsData.filter(job => job.type === filterType);
        }
        setJobs(jobsData);
      } catch (err) {
        console.error("[JobsAuth] fetch error:", err);
        setError("Impossible de charger les offres. Veuillez réessayer.");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filterExp, filterQuali, filterType, sessionLoading]);

  // Animation des cartes
  useEffect(() => {
    if (!loading && jobs.length > 0) {
      setVisible([]);
      jobs.forEach((_, i) => {
        setTimeout(() => setVisible(prev => [...prev, i]), i * 60);
      });
    }
  }, [jobs, loading]);

  // Filtrage local (recherche texte)
  const filtered = jobs.filter(job => {
    return search === "" ||
      job.titre?.toLowerCase().includes(search.toLowerCase()) ||
      job.entreprise?.toLowerCase().includes(search.toLowerCase());
  });

  if (sessionLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="ins-spinner" aria-label="Chargement…" />
      </div>
    );
  }

  return (
    <Menu session={session} onLogout={logout}>
      <div className="db-greeting">
        <h2>Offres d'emploi</h2>
        <p>Découvrez les opportunités de carrière disponibles</p>
      </div>

      {/* Stats */}
      <div className="db-stats jb-stats">
        <div className="db-stat jb-stat-pill">
          <span className="db-stat-n">{jobs.length}</span>
          <span className="db-stat-l">Total des offres</span>
        </div>
        <div className="db-stat jb-stat-pill">
          <span className="db-stat-n">{filtered.length}</span>
          <span className="db-stat-l">Résultats filtrés</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="jb-toolbar">
        <div className="jb-search-wrapper">
          <span className="jb-search-ico"><InlineIcon name="search" /></span>
          <input
            className="jb-search"
            type="text"
            placeholder="Rechercher un poste, une entreprise..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="jb-search-clear" onClick={() => setSearch("")}>
              <InlineIcon name="x" />
            </button>
          )}
        </div>

        <div className="jb-filter-wrapper">
          <select
            className="jb-filter-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            {TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="jb-filter-wrapper">
          <select
            className="jb-filter-select"
            value={filterExp}
            onChange={e => setFilterExp(e.target.value)}
          >
            {EXPERIENCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="jb-filter-wrapper">
          <select
            className="jb-filter-select"
            value={filterQuali}
            onChange={e => setFilterQuali(e.target.value)}
          >
            {QUALIFICATION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="jb-view-toggle">
          <button
            className={`jb-view-btn${viewMode === "grid" ? " jb-view-btn--active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Vue grille"
          >
            <InlineIcon name="grid2" />
          </button>
          <button
            className={`jb-view-btn${viewMode === "list" ? " jb-view-btn--active" : ""}`}
            onClick={() => setViewMode("list")}
            title="Vue liste"
          >
            <InlineIcon name="list" />
          </button>
        </div>
      </div>

      {/* Compteur + filtres actifs */}
      <div className="jb-result-count">
        {filtered.length} offre{filtered.length > 1 ? "s" : ""}
        {(filterExp || filterQuali || filterType || search) && (
          <> · {[
            filterType  ? TYPE_OPTIONS.find(o => o.value === filterType)?.label          : "",
            filterExp   ? EXPERIENCE_OPTIONS.find(o => o.value === filterExp)?.label     : "",
            filterQuali ? QUALIFICATION_OPTIONS.find(o => o.value === filterQuali)?.label : "",
            search      ? `"${search}"`                                                   : "",
          ].filter(Boolean).join(" · ")}</>
        )}
      </div>

      
      

      {/* Chargement */}
      {loading && (
        <div className="db-loading" role="status" aria-live="polite">
          <div className="ins-spinner" aria-hidden="true" />
          <p>Chargement des offres…</p>
        </div>
      )}

      {/* Erreur */}
      {error && !loading && (
        <div className="db-error" role="alert">
          <i className="fas fa-exclamation-circle" aria-hidden="true" /> {error}
        </div>
      )}

      {/* ── Vue GRILLE ── */}
      {!loading && !error && viewMode === "grid" && (
        <div className="db-grid jb-grid">
          {filtered.length === 0 ? (
            <div className="db-empty">
              <p>Aucune offre ne correspond à votre recherche</p>
              <button
                className="db-empty-cta"
                onClick={() => {
                  setSearch("");
                  setFilterExp("");
                  setFilterQuali("");
                  setFilterType("");
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filtered.map((job) => {
              const originalIndex = jobs.findIndex(j => j.id === job.id);
              const color = CARD_COLORS[originalIndex % CARD_COLORS.length];
              return (
                <div
                  key={job.id}
                  className={`db-card jb-card${visible.includes(originalIndex) ? " db-card--visible" : ""}`}
                  onClick={() => setSelected({ ...job, colorIndex: originalIndex })}
                >
                  <h4 className="db-card-title">{job.titre}</h4>

                  <div className="jb-card-company">
                    <InlineIcon name="briefcase" />
                    <span>{job.entreprise}</span>
                  </div>

                  <div className="db-card-meta">
                    {job.type && (
                      <span className="db-badge jb-badge-type">{job.type}</span>
                    )}
                    {job.exp && (
                      <span className="db-badge db-badge--co">{job.exp}</span>
                    )}
                    {job.quali && (
                      <span className="db-badge jb-badge-quali">{job.quali}</span>
                    )}
                  </div>

                  <div className="jb-card-footer">
                    <span className="db-card-date">
                      <InlineIcon name="clock" />
                      {timeAgo(job.Date_pub)}
                    </span>
                    <span className="jb-card-deadline">
                      <InlineIcon name="calendar" />
                      {formatDateFR(job.Date_lim_can)}
                    </span>
                  </div>

                  {/* ── Score de compatibilité IA ── */}
                  {token && (
                    <div
                      className="jb-card-compat"
                      onClick={e => e.stopPropagation()} /* évite d'ouvrir la modal au clic tooltip */
                    >
                      <CompatibilityBadge jobId={job.id} token={token} />
                    </div>
                  )}

                  <div className="jb-card-view">
                    <InlineIcon name="eye" />
                    Voir l'offre
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Vue LISTE ── */}
      {!loading && !error && viewMode === "list" && (
        <div className="jb-list">
          {filtered.length === 0 ? (
            <div className="db-empty">
              <p>Aucune offre ne correspond à votre recherche</p>
              <button
                className="db-empty-cta"
                onClick={() => {
                  setSearch("");
                  setFilterExp("");
                  setFilterQuali("");
                  setFilterType("");
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filtered.map((job) => {
              const originalIndex = jobs.findIndex(j => j.id === job.id);
              const color = CARD_COLORS[originalIndex % CARD_COLORS.length];
              return (
                <div
                  key={job.id}
                  className={`jb-list-row${visible.includes(originalIndex) ? " jb-list-row--visible" : ""}`}
                  onClick={() => setSelected({ ...job, colorIndex: originalIndex })}
                >
                  <div className="jb-list-ico" style={{ background: color.bg }}>
                    <IconSVG name={color.icon} stroke={color.stroke} />
                  </div>

                  <div className="jb-list-info">
                    <span className="jb-list-titre">{job.titre}</span>
                    <span className="jb-list-sub">{job.entreprise}</span>
                  </div>

                  <div className="jb-list-badges">
                    {job.type  && <span className="db-badge jb-badge-type">{job.type}</span>}
                    {job.exp   && <span className="db-badge db-badge--co">{job.exp}</span>}
                    {job.quali && <span className="db-badge jb-badge-quali">{job.quali}</span>}
                  </div>

                  <span className="jb-list-date">
                    <InlineIcon name="clock" />
                    {timeAgo(job.Date_pub)}
                  </span>

                  {/* ── Score compact vue liste ── */}
                  {token && (
                    <div
                      className="jb-list-compat"
                      onClick={e => e.stopPropagation()}
                    >
                      <CompatibilityBadge jobId={job.id} token={token} compact={true} />
                    </div>
                  )}

                  <span className="jb-list-arrow">
                    <InlineIcon name="eye" />
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Modal détail ── */}
      {selected && (
        <DetailModal
          job={selected}
          colorIndex={selected.colorIndex}
          token={token}
          onClose={() => setSelected(null)}
        />
      )}
    </Menu>
  );
}