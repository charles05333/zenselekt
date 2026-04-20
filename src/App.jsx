import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./assets/css/index.css";
import zenImg from "./assets/img/zen.png";
import zenaImg from "./assets/img/zena.png";


// ─── Sample data (à remplacer par un fetch API) ───────────────────────────────
const SAMPLE_JOBS = [
  { id: 1, titre: "Développeur Full Stack",  Date_pub: "2025-04-15", Date_lim_can: "2025-12-31" },
  { id: 2, titre: "Chef de projet IT",       Date_pub: "2025-04-10", Date_lim_can: "2025-12-31" },
  { id: 3, titre: "Responsable RH",          Date_pub: "2025-04-08", Date_lim_can: "2025-12-31" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function getRelativeDate(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff < 7)  return `Il y a ${diff} jour${diff > 1 ? "s" : ""}`;
  const w = Math.floor(diff / 7);
  return `Il y a ${w} semaine${w > 1 ? "s" : ""}`;
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (e, id) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.querySelector(id);
    if (el) {
      const offset = document.querySelector(".header")?.offsetHeight || 70;
      window.scrollTo({ top: el.offsetTop - offset, behavior: "smooth" });
    }
  };

  return (
    <header className={`header${scrolled ? " header--scrolled" : ""}`}>
      <div className="container">
        <nav className="navbar">
          {/* Logo */}
          <a className="navbar-brand" href="#hero" onClick={(e) => scrollTo(e, "#hero")}>
            <img src={zenImg} alt="Zenselekt" />
          </a>

          {/* Hamburger */}
          <button
            className={`navbar-toggler${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>

          {/* Nav links */}
          <div className={`nav-collapse${menuOpen ? " show" : ""}`}>
            <ul className="nav-list">

              {/* Accueil */}
              <li>
                <a className="nav-link active" href="#hero" onClick={(e) => scrollTo(e, "#hero")}>
                  Accueil
                </a>
              </li>

              {/* Dropdown Postulez */}
            <li
  className="nav-dropdown"
  onClick={() => setDropOpen(!dropOpen)}
>
               <span className="nav-link dropdown-toggle">
  Postulez <i className={`fas fa-chevron-down dropdown-arrow${dropOpen ? " open" : ""}`} />
</span>
                {dropOpen && (
                  <ul className="dropdown-menu">
                    <li>
  <Link className="dropdown-item" to="/jobs" onClick={() => { setMenuOpen(false); setDropOpen(false); }}>
    Offres d'emploi
  </Link>
</li>
<li>
  <Link className="dropdown-item" to="/inscription-spontanee" onClick={() => { setMenuOpen(false); setDropOpen(false); }}>
    Candidature spontanée
  </Link>
</li>
                  </ul>
                )}
              </li>

              {/* ✅ Connexion — React Router Link */}
              <li>
                <Link className="nav-link" to="/connexion" onClick={() => setMenuOpen(false)}>
                  <i className="fas fa-sign-in-alt" /> Connexion
                </Link>
              </li>

              {/* ✅ Inscription — React Router Link */}
              <li>
                <Link className="nav-link" to="/inscription" onClick={() => setMenuOpen(false)}>
                  <i className="fas fa-user-plus" /> Inscription
                </Link>
              </li>

            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section id="hero" className="hero">
      <div className="hero-bg-circle hero-bg-circle--1" />
      <div className="hero-bg-circle hero-bg-circle--2" />
      <div className="container">
        <div className="hero-row">
          <div className="hero-text fade-in-up">
            <h1>
              <span className="text-accent">Boostez votre<br /> carrière </span>
              <span className="text-dark">avec des<br /> opportunités <br /> venant</span>
              <span className="text-accent"> de plusieurs entreprises</span>
            </h1>
            <p className="hero-lead">
              Découvrez des offres variées et trouvez celle qui correspond à votre profil.
            </p>
          </div>
          <div className="hero-img fade-in-up delay-200">
            <img src={zenaImg} alt="Recrutement" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, index }) {
  if (new Date() > new Date(job.Date_lim_can)) return null;

  return (
    <div className="job-card fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
      <h4>{job.titre}</h4>
      <div className="job-meta">
        <i className="fas fa-calendar-alt" /> Publié {getRelativeDate(job.Date_pub)}
      </div>
      {/* ✅ React Router Link — plus de "connexion.php" */}
      <Link to="/connexion" className="btn-apply">
        Postuler maintenant
      </Link>
    </div>
  );
}

// ─── Jobs Section ─────────────────────────────────────────────────────────────
function JobsSection() {
  // 🔌 Remplace SAMPLE_JOBS par un fetch sur ton API PHP :
  // const [jobs, setJobs] = useState([]);
  // useEffect(() => { fetch("/api/offres").then(r=>r.json()).then(setJobs); }, []);
  const jobs = SAMPLE_JOBS;

  return (
    <section className="section section--gray">
      <div className="container">
        <div className="section-header">
          <p className="section-label">Les dernières offres</p>
        </div>
        <div className="jobs-grid">
          {jobs.length === 0 ? (
            <div className="job-card empty-card">
              <h3>Aucune offre disponible actuellement</h3>
              <p>Revenez bientôt pour découvrir de nouvelles opportunités.</p>
            </div>
          ) : (
            jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)
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
          <i
            className={`fas ${ok ? "fa-check-circle" : "fa-exclamation-circle"}`}
            style={{ color: ok ? "#10B981" : "#EF4444" }}
          />
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
        <p>© 2025 Zenselekt - Tous droits réservés</p>
        <p>
          Développé par{" "}
          <a href="https://empowertaca.com" target="_blank" rel="noreferrer">
            Empower Talents and Careers
          </a>
        </p>
        <Link to="/conditions">Conditions générales d'utilisation</Link>
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