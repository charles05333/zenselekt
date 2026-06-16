import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./assets/css/index.css";
import zenImg from "./assets/img/zen.png";

// ─── API Configuration ───────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || '';

// ─── Helper ───────────────────────────────────────────────────────────────────
function getRelativeDate(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff < 7)  return `Il y a ${diff} jour${diff > 1 ? "s" : ""}`;
  const w = Math.floor(diff / 7);
  return `Il y a ${w} semaine${w > 1 ? "s" : ""}`;
}

function isNew(dateStr) {
  return Math.floor((new Date() - new Date(dateStr)) / 86400000) <= 3;
}

// ─── Job icon SVGs ────────────────────────────────────────────────────────────
const JOB_ICONS = [
  <svg key="1" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="14" height="10" rx="2"/><path d="M6 6V4a2 2 0 014 0v2"/></svg>,
  <svg key="2" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 2a3 3 0 110 6 3 3 0 010-6z"/><path d="M3 16c0-3 2.7-5 6-5s6 2 6 5"/></svg>,
  <svg key="3" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 15v-1.5A2.5 2.5 0 0010.5 11h-6A2.5 2.5 0 002 13.5V15"/><circle cx="7.5" cy="6" r="3"/><path d="M16 15v-1.5a2.5 2.5 0 00-2-2.45"/><path d="M12 3.13a2.5 2.5 0 010 4.74"/></svg>,
];

// ─── Header ───────────────────────────────────────────────────────────────────
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (e, id) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.querySelector(id);
    if (el) {
      const offset = document.querySelector(".header")?.offsetHeight || 60;
      window.scrollTo({ top: el.offsetTop - offset, behavior: "smooth" });
    }
  };

  return (
    <header className={`header${scrolled ? " header--scrolled" : ""}`}>
      <div className="container">
        <nav className="navbar">
          <a className="navbar-brand" href="#hero" onClick={(e) => scrollTo(e, "#hero")}>
            <img src={zenImg} alt="Zenselekt" className="logo-img" />
          </a>

          <button
            className={`navbar-toggler${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>

          <div className={`nav-collapse${menuOpen ? " show" : ""}`}>
            <ul className="nav-list">
              <li>
                <a className="nav-link active" href="#hero" onClick={(e) => scrollTo(e, "#hero")}>
                  Accueil
                </a>
              </li>

              <li className="nav-dropdown" onClick={() => setDropOpen(!dropOpen)}>
                <span className="nav-link dropdown-toggle">
                  Postulez{" "}
                  <i className={`fas fa-chevron-down dropdown-arrow${dropOpen ? " open" : ""}`} />
                </span>
                {dropOpen && (
                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/jobs"
                        onClick={() => { setMenuOpen(false); setDropOpen(false); }}>
                        Offres d'emploi
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/inscription-spontanee"
                        onClick={() => { setMenuOpen(false); setDropOpen(false); }}>
                        Candidature spontanée
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <Link className="nav-link" to="/connexion" onClick={() => setMenuOpen(false)}>
                  Connexion
                </Link>
              </li>

              <li>
                <Link className="nav-btn-cta" to="/inscription" onClick={() => setMenuOpen(false)}>
                  Inscription
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalCandidates: 0,
    satisfaction: 95,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/APP`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (result.success) {
          setStats({
            activeJobs:      result.data.activeJobs,
            totalCandidates: result.data.totalCandidates,
            satisfaction:    result.data.satisfaction,
            loading:         false,
          });
        } else {
          setStats(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Erreur fetch stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  return (
    <section id="hero" className="hero">
      <div className="container">
        <div className="hero-grid">

          <div className="hero-left fade-in-up">
            <h1>
              Votre avenir <span className="accent">professionnel</span><br />
              commence ici
            </h1>

            <p className="hero-lead">
              Matching intelligent, offres vérifiées et accompagnement humain à chaque étape.
            </p>

            <div className="hero-actions">
              <Link to="/jobs" className="btn-hero">
                Voir les offres
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M2 7h10M8 3l4 4-4 4"/>
                </svg>
              </Link>
              <Link to="/inscription-spontanee" className="btn-hero-outline">
                Candidature spontanée
              </Link>
            </div>

            <div className="hero-kpis">
              <div className="kpi">
                <div className="kpi-num">
                  {stats.loading ? (
                    <span className="kpi-loader">---</span>
                  ) : (
                    <>{stats.activeJobs}<sup>+</sup></>
                  )}
                </div>
                <div className="kpi-label">Offres actives</div>
              </div>
              <div className="kpi">
                <div className="kpi-num">
                  {stats.loading ? (
                    <span className="kpi-loader">---</span>
                  ) : (
                    <>{stats.totalCandidates}<sup>+</sup></>
                  )}
                </div>
                <div className="kpi-label">Candidats inscrits</div>
              </div>
              <div className="kpi">
                <div className="kpi-num">
                  {stats.loading ? (
                    <span className="kpi-loader">---</span>
                  ) : (
                    <>{stats.satisfaction}<sup>%</sup></>
                  )}
                </div>
                <div className="kpi-label">Satisfaction</div>
              </div>
            </div>
          </div>

          <div className="hero-visual fade-in-up delay-200">
            <div className="vis-bg">
              <div className="vis-blob1" />
              <div className="vis-blob2" />
              <div className="vis-accent" />
            </div>

            <div className="vis-card vc1">
              <div className="vc-label">Offre du jour</div>
              <div className="vc-row">
                <div className="vc-dot vc-dot--navy">
                  <svg viewBox="0 0 13 13" fill="none" stroke="#003D5C" strokeWidth="1.8">
                    <rect x="1" y="4" width="11" height="8" rx="1.5"/>
                    <path d="M4 4V3a2 2 0 014 0v1"/>
                  </svg>
                </div>
                <div>
                  <div className="vc-name">Dév. Full Stack</div>
                  <div className="vc-sub">Publié aujourd'hui</div>
                </div>
              </div>
              <span className="vc-chip chip-teal">CDI · Télétravail</span>
            </div>

            <div className="vis-card vc2">
              <div className="vc-label">Candidatures</div>
              <div className="avatars">
                <div className="av" style={{background:"#5DABA8"}}>A</div>
                <div className="av" style={{background:"#003D5C"}}>M</div>
                <div className="av" style={{background:"#7AC4C1"}}>K</div>
                <div className="av av-count">+14</div>
              </div>
              <div className="vc-bar"><div className="vc-bar-fill" style={{width:"68%"}} /></div>
              <div className="vc-bar-label">17 / 25 postes pourvus</div>
            </div>

            <div className="vis-card vc3">
              <div className="vc-label">Match profil</div>
              <div className="vc-row">
                <div className="vc-dot vc-dot--green">
                  <svg viewBox="0 0 13 13" fill="none" stroke="#3B6D11" strokeWidth="2">
                    <polyline points="2,7 5,10 11,4"/>
                  </svg>
                </div>
                <div>
                  <div className="vc-name">Responsable RH</div>
                  <div className="vc-sub">Compatibilité 92%</div>
                </div>
              </div>
              <span className="vc-chip chip-green">Recommandé</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Feature Strip ────────────────────────────────────────────────────────────
function FeatureStrip() {
  const features = [
    {
      icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,8 6,11 13,5"/></svg>,
      title: "Offres vérifiées",
      desc: "Chaque annonce est contrôlée avant publication.",
    },
    {
      icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2.5 1.5"/></svg>,
      title: "Réponse sous 48h",
      desc: "Nos recruteurs répondent rapidement, toujours.",
    },
    {
      icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2a3 3 0 100 6 3 3 0 000-6z"/><path d="M3 14c0-2.2 2.2-4 5-4s5 1.8 5 4"/></svg>,
      title: "Suivi personnalisé",
      desc: "Un accompagnement humain tout au long du processus.",
    },
  ];

  return (
    <div className="feature-strip">
      <div className="container">
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feat" key={i}>
              <div className="feat-ico">{f.icon}</div>
              <div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, index }) {
  if (new Date() > new Date(job.Date_lim_can)) return null;

  return (
    <div className="job-card fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="job-body">
        <div className="job-title">{job.titre}</div>
        <div className="job-meta">
          {isNew(job.Date_pub) && <span className="chip chip-new">Nouveau</span>}
          <span className="chip chip-date">
            <i className="fas fa-calendar-alt" /> {getRelativeDate(job.Date_pub)}
          </span>
          {job.type && <span className="chip chip-type">{job.type}</span>}
        </div>
      </div>
      <Link to="/connexion" className="btn-apply">Postuler</Link>
    </div>
  );
}

// ─── Jobs Section ─────────────────────────────────────────────────────────────
function JobsSection() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${API_BASE}/APP`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        // ✅ FIX : plus de fallback, on affiche seulement ce que l'API retourne
        if (result.success && result.data?.recentJobs?.length > 0) {
          setJobs(result.data.recentJobs);
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error('Erreur fetch jobs:', error);
        setJobs([]); // ✅ FIX : vide au lieu de FALLBACK_JOBS
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const activeJobs = jobs.filter(job => new Date() <= new Date(job.Date_lim_can));

  return (
    <section className="jobs-section">
      <div className="container">
        <div className="sec-head">
          <div>
            <div className="sec-label">Opportunités du moment</div>
            <h2 className="sec-title">Dernières offres publiées</h2>
          </div>
          <Link to="/jobs" className="sec-link">
            Toutes les offres
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6.5h9M7 2.5l4 4-4 4"/>
            </svg>
          </Link>
        </div>

        <div className="jobs-list">
          {loading ? (
            <div className="empty-card">
              <div className="loader-spinner" />
              <p>Chargement des offres...</p>
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <rect x="8" y="14" width="32" height="26" rx="3"/>
                  <path d="M16 14v-2a4 4 0 018 0v2"/>
                  <path d="M18 26h12M18 32h8"/>
                </svg>
              </div>
              <h3>Aucune offre disponible</h3>
              <p>Revenez prochainement, de nouvelles opportunités arrivent bientôt.</p>
            </div>
          ) : (
            activeJobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ type, title, message, onClose }) {
  if (!type) return null;
  const ok = type === "success";
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-box${ok ? " modal-box--success" : " modal-box--error"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-icon">
          <i className={`fas ${ok ? "fa-check-circle" : "fa-exclamation-circle"}`}
            style={{ color: ok ? "#10B981" : "#EF4444" }} />
        </div>
        <h5 className="modal-title">{title}</h5>
        <p className="modal-message">{message}</p>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          <div className="ft-brand">
            <a className="ft-logo" href="#hero">
              <img src={zenImg} alt="Zenselekt" className="logo-img" />
            </a>
            <p className="ft-tagline">
              Votre passerelle vers les meilleures opportunités professionnelles en Côte d'Ivoire.
            </p>
            <div className="ft-social">
              <a href="#" className="ft-social-ico" title="LinkedIn">
                <i className="fab fa-linkedin-in" />
              </a>
            <a
  href="https://www.facebook.com/zenselekt"
  className="ft-social-ico"
  title="Facebook"
  target="_blank"
  rel="noopener noreferrer"
>
  <i className="fab fa-facebook-f" />
</a>
              <a href="#" className="ft-social-ico" title="WhatsApp">
                <i className="fab fa-whatsapp" />
              </a>
            </div>
          </div>

          <div>
            <div className="ft-col-title">Navigation</div>
            <ul className="ft-col-links">
              <li><a href="#hero">Accueil</a></li>
              <li><Link to="/jobs">Offres d'emploi</Link></li>
              <li><Link to="/inscription-spontanee">Candidature spontanée</Link></li>
              <li><Link to="/inscription">Inscription</Link></li>
              <li><Link to="/connexion">Connexion</Link></li>
            </ul>
          </div>

          <div>
            <div className="ft-col-title">Candidats</div>
            <ul className="ft-col-links">
              <li><Link to="/connexion">Mon espace candidat</Link></li>
              <li><Link to="/connexion">Offres d'emploi</Link></li>
              <li><Link to="/connexion">Mon profil</Link></li>
              <li><a href="#">Créer un CV</a></li>
              <li><Link to="/connexion">Suivre mes candidatures</Link></li>
            </ul>
          </div>

          <div>
            <div className="ft-col-title">Contact</div>
            <div className="ft-contact-item">
              <div className="ft-contact-ico"><i className="fas fa-map-marker-alt" /></div>
              <div>
                <div className="ft-contact-label">Adresse</div>
                <div className="ft-contact-value">Abidjan, Côte d'Ivoire</div>
              </div>
            </div>
            <div className="ft-contact-item">
              <div className="ft-contact-ico"><i className="fas fa-envelope" /></div>
              <div>
                <div className="ft-contact-label">Email</div>
                <div className="ft-contact-value">contact@zenselekt.com</div>
              </div>
            </div>
            <div className="ft-contact-item">
              <div className="ft-contact-ico"><i className="fas fa-phone" /></div>
              <div>
                <div className="ft-contact-label">Téléphone</div>
                <div className="ft-contact-value">+225 07 58 03 40 78</div>
              </div>
            </div>
          </div>

        </div>

        <hr className="ft-divider" />

        <div className="ft-bottom">
          <div className="ft-bottom-left">
            © 2025 Zenselekt · Propulsé par{" "}
            <a href="https://empowertaca.com" target="_blank" rel="noreferrer">
              Empower Talents and Careers
            </a>
          </div>
          <div className="ft-bottom-right">
            <Link to="/conditions">Conditions d'utilisation</Link>
            <a href="#">Politique de confidentialité</a>
            <a href="#">Mentions légales</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Back To Top ──────────────────────────────────────────────────────────────
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <a
      href="#"
      className={`back-to-top${visible ? " show" : ""}`}
      onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      aria-label="Retour en haut"
    >
      <i className="fas fa-arrow-up" />
    </a>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [modal, setModal] = useState({ type: null, title: "", message: "" });

  useEffect(() => {
    if (window.__ZEN_SUCCESS__)
      setModal({ type: "success", title: "Succès",  message: window.__ZEN_SUCCESS__ });
    else if (window.__ZEN_ERROR__)
      setModal({ type: "error",   title: "Erreur",  message: window.__ZEN_ERROR__ });
  }, []);

  return (
    <>
      <Header />
      <HeroSection />
      <FeatureStrip />
      <JobsSection />
      <Footer />
      <BackToTop />
      {modal.type && (
        <Modal
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => setModal({ type: null, title: "", message: "" })}
        />
      )}
    </>
  );
}