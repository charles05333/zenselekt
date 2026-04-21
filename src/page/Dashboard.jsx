import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./css/dashboard.css";
import zenImg from "../assets/img/zen.png";

const SESSION = {
  prenoms: "Jean",
  nom: "Dupont",
  email: "jean.dupont@example.com",
};

const MOCK_CANDIDATURES = [
  { id: 1, titre: "Développeur Full Stack",  Date_pub: "2025-03-10", statut: "entretien_valide"  },
  { id: 2, titre: "Chef de Projet Digital",  Date_pub: "2025-02-28", statut: "en_evaluation"     },
  { id: 3, titre: "Analyste Business",       Date_pub: "2025-02-14", statut: "retenu_entretien"  },
  { id: 4, titre: "Responsable RH",          Date_pub: "2025-01-30", statut: "non_retenu"        },
  { id: 5, titre: "UX Designer Senior",      Date_pub: "2025-01-15", statut: "reserve"           },
  { id: 6, titre: "Data Engineer",           Date_pub: "2025-01-05", statut: "recrute"           },
];

const CARD_COLORS = [
  { bg: "#eeedfe", stroke: "#534ab7", icon: "rocket"    },
  { bg: "#faeeda", stroke: "#854f0b", icon: "chart"     },
  { bg: "#e6f1fb", stroke: "#185fa5", icon: "bar"       },
  { bg: "#fcebeb", stroke: "#a32d2d", icon: "users"     },
  { bg: "#f1efe8", stroke: "#5f5e5a", icon: "briefcase" },
  { bg: "#eaf3de", stroke: "#3b6d11", icon: "cog"       },
];

const STATUT_LABELS = {
  en_evaluation:    { label: "En cours d'évaluation",  cls: "badge-evaluation"    },
  retenu_entretien: { label: "Retenu pour entretien",  cls: "badge-entretien"     },
  entretien_valide: { label: "Entretien validé",       cls: "badge-valide"        },
  non_retenu:       { label: "Non retenu",             cls: "badge-non-retenu"    },
  reserve:          { label: "Mis en réserve",         cls: "badge-reserve"       },
  recrute:          { label: "Recruté",                cls: "badge-recrute"       },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

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

function SideIcon({ name }) {
  const s = { fill: "none", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "grid") return (
    <svg viewBox="0 0 24 24" style={s}>
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
  if (name === "user") return (
    <svg viewBox="0 0 24 24" style={s}>
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
  if (name === "file") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
  if (name === "search") return (
    <svg viewBox="0 0 24 24" style={s}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  if (name === "logout") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
  return null;
}

export default function Dashboard() {
  const [cards, setCards]         = useState([]);
  const [visible, setVisible]     = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef                  = useRef(null);
  const location                  = useLocation();

  useEffect(() => {
    setTimeout(() => setCards(MOCK_CANDIDATURES), 200);
  }, []);

  useEffect(() => {
    cards.forEach((_, i) => {
      setTimeout(() => setVisible((prev) => [...prev, i]), i * 100);
    });
  }, [cards]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const initials = `${SESSION.prenoms[0]}${SESSION.nom[0]}`;

  const stats = [
    { n: MOCK_CANDIDATURES.length,                                                        label: "Candidatures"                         },
    { n: MOCK_CANDIDATURES.filter(c => c.statut === "en_evaluation").length,              label: "En évaluation"                        },
    { n: MOCK_CANDIDATURES.filter(c => c.statut === "retenu_entretien" || c.statut === "entretien_valide").length, label: "Entretiens" },
    { n: MOCK_CANDIDATURES.filter(c => c.statut === "recrute").length,                    label: "Recrutés"                             },
  ];

  return (
    <div className="db-wrapper">

      {/* ── Topbar ── */}
      <header className="db-topbar">
        <Link to="/dashbord" className="db-topbar-logo">
          <img src={zenImg} alt="Zenselekt" />
        </Link>

        <nav className="db-topbar-nav">
          <Link to="/dashbord" className={`db-tn${location.pathname === "/dashbord" ? " db-tn--active" : ""}`}>
            Accueil
          </Link>
          <Link to="/jobs" className={`db-tn${location.pathname === "/jobs" ? " db-tn--active" : ""}`}>
            Offres d'emploi
          </Link>
        </nav>

        <div className="db-topbar-right">

          {/* Icône notification */}
          <div className="db-notif-wrapper" ref={notifRef}>
            <button className="db-notif-btn" onClick={() => setNotifOpen(!notifOpen)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="db-notif-dot"></span>
            </button>

            {notifOpen && (
              <div className="db-notif-panel">
                <div className="db-notif-item">
                  <span className="db-notif-ico">👋</span>
                  <span>Bonjour {SESSION.prenoms} !</span>
                </div>
              </div>
            )}
          </div>

          <span className="db-topbar-name">{SESSION.prenoms} {SESSION.nom}</span>
          <div className="db-avatar">{initials}</div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="db-body">

        {/* ── Sidebar icônes ── */}
        <aside className="db-sidebar">
          <div className="db-sidebar-top">
            <Link to="/dashbord"     className={`db-si${location.pathname === "/dashbord"     ? " db-si--active" : ""}`}>
              <SideIcon name="grid"   /><span className="db-si-tip">Tableau de bord</span>
            </Link>
            <Link to="/profil"       className={`db-si${location.pathname === "/profil"       ? " db-si--active" : ""}`}>
              <SideIcon name="user"   /><span className="db-si-tip">Mon profil</span>
            </Link>
            <Link to="/candidatures" className={`db-si${location.pathname === "/candidatures" ? " db-si--active" : ""}`}>
              <SideIcon name="file"   /><span className="db-si-tip">Candidatures</span>
            </Link>
            <Link to="/jobs"         className={`db-si${location.pathname === "/jobs"         ? " db-si--active" : ""}`}>
              <SideIcon name="search" /><span className="db-si-tip">Offres d'emploi</span>
            </Link>
          </div>
          <div className="db-sidebar-bottom">
            <Link to="/connexion" className="db-si">
              <SideIcon name="logout" /><span className="db-si-tip">Déconnexion</span>
            </Link>
          </div>
        </aside>

        {/* ── Contenu principal ── */}
        <main className="db-main">

          {/* Greeting */}
          <div className="db-greeting">
            <h2>Bonjour, {SESSION.prenoms} 👋</h2>
            <p>Voici un aperçu de vos candidatures récentes</p>
          </div>

          {/* Stats */}
          <div className="db-stats">
            {stats.map((s, i) => (
              <div key={i} className="db-stat">
                <span className="db-stat-n">{s.n}</span>
                <span className="db-stat-l">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Section candidatures */}
          <div className="db-section-head">
            <h3>Récentes candidatures</h3>
            <Link to="/candidatures" className="db-see-all">Voir tout</Link>
          </div>

          <div className="db-grid">
            {cards.length === 0 ? (
              <div className="db-empty">
                <p>Aucune candidature pour le moment</p>
                <Link to="/jobs" className="db-empty-cta">Explorer les offres</Link>
              </div>
            ) : (
              cards.map((row, index) => {
                const color  = CARD_COLORS[index % CARD_COLORS.length];
                const statut = STATUT_LABELS[row.statut] || STATUT_LABELS.en_evaluation;
                return (
                  <div
                    key={row.id}
                    className={`db-card${visible.includes(index) ? " db-card--visible" : ""}`}
                  >
                    <div className="db-card-ico" style={{ background: color.bg }}>
                      <IconSVG name={color.icon} stroke={color.stroke} />
                    </div>
                    <h4 className="db-card-title">{row.titre}</h4>
                    <div className="db-card-meta">
                      <span className="db-badge db-badge--co">EMPOWER</span>
                      <span className={`db-badge ${statut.cls}`}>{statut.label}</span>
                    </div>
                    <span className="db-card-date">{formatDate(row.Date_pub)}</span>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* ── Bottom nav mobile ── */}
      <nav className="db-bottom-nav">
        <Link to="/dashbord" className={`db-bn-item${location.pathname === "/dashbord" ? " db-bn-item--active" : ""}`}>
          <SideIcon name="grid" />
          <span>Accueil</span>
        </Link>
        <Link to="/profil" className={`db-bn-item${location.pathname === "/profil" ? " db-bn-item--active" : ""}`}>
          <SideIcon name="user" />
          <span>Profil</span>
        </Link>
        <Link to="/candidatures" className={`db-bn-item${location.pathname === "/candidatures" ? " db-bn-item--active" : ""}`}>
          <SideIcon name="file" />
          <span>Candidatures</span>
        </Link>
        <Link to="/jobs" className={`db-bn-item${location.pathname === "/jobs" ? " db-bn-item--active" : ""}`}>
          <SideIcon name="search" />
          <span>Offres</span>
        </Link>
      </nav>

      {/* ── Footer ── */}
      <footer className="db-footer">
        <div className="container">
          <p>© 2025 Zenselekt - Tous droits réservés</p>
          <p>
            Développé par{" "}
            <a href="https://empowertaca.com" target="_blank" rel="noreferrer">
              Empower Talents and Careers
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
}