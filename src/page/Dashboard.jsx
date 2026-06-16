import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Menu from "./Menu";
import { useSessionGuard } from "../auth/useSessionGuard.jsx";
import "./css/dashboard.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || '';

const CARD_COLORS = [
  { bg: "#eeedfe", stroke: "#534ab7", icon: "rocket"    },
  { bg: "#faeeda", stroke: "#854f0b", icon: "chart"     },
  { bg: "#e6f1fb", stroke: "#185fa5", icon: "bar"       },
  { bg: "#fcebeb", stroke: "#a32d2d", icon: "users"     },
  { bg: "#f1efe8", stroke: "#5f5e5a", icon: "briefcase" },
  { bg: "#eaf3de", stroke: "#3b6d11", icon: "cog"       },
];

const STATUT_LABELS = {
    en_evaluation:    { label: "En cours d'évaluation", cls: "badge-evaluation" },
    retenu_entretien: { label: "Retenu pour entretien",  cls: "badge-entretien"  },
    entretien_valide: { label: "Entretien validé",        cls: "badge-valide"     },
    non_retenu_cv:    { label: "CV non retenu",           cls: "badge-non-retenu" },
    non_retenu:       { label: "Non retenu",              cls: "badge-non-retenu" },
    reserve:          { label: "Mis en réserve",          cls: "badge-reserve"    },
    recrute:          { label: "Recruté",                 cls: "badge-recrute"    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Helper : regroupe les deux variantes de refus
const isNonRetenu = (statut) => statut === "non_retenu" || statut === "non_retenu_cv";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
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
  if (name === "alert") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  if (name === "refresh") return (
    <svg viewBox="0 0 24 24" style={s}>
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
  return null;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="db-card" style={{ opacity: 1 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "#e2e8f0", marginBottom: 12 }} />
      <div style={{ height: 16, background: "#e2e8f0", borderRadius: 6, marginBottom: 8, width: "80%" }} />
      <div style={{ height: 13, background: "#e2e8f0", borderRadius: 6, marginBottom: 16, width: "60%" }} />
      <div style={{ height: 24, background: "#e2e8f0", borderRadius: 20, width: "40%" }} />
    </div>
  );
}

// ─── Modal de confirmation de déconnexion ─────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="db-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-title">
      <div className="db-modal">
        <div className="db-modal-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
        <h3 id="logout-title">Se déconnecter ?</h3>
        <p>Vous allez être redirigé vers la page de connexion.</p>
        <div className="db-modal-btns">
          <button className="ins-btn ins-btn--ghost" onClick={onCancel}>Annuler</button>
          <button className="ins-btn ins-btn--danger" onClick={onConfirm}>Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  // ── Garde de session ──────────────────────────────────────────────────────
  const { session, loading, logout } = useSessionGuard({
    redirectTo:    "/connexion",
    checkInterval: 5 * 60 * 1000,
  });

  // ── Candidatures ──────────────────────────────────────────────────────────
  // allCandidatures : liste complète pour les stats (pas limitée à 6)
  const [allCandidatures,  setAllCandidatures]  = useState([]);
  // candidatures : les 6 premières pour l'affichage des cartes
  const [candidatures,     setCandidatures]     = useState([]);
  const [loadingCands,     setLoadingCands]     = useState(true);
  const [errorCands,       setErrorCands]       = useState("");
  const [visible,          setVisible]          = useState([]);

  // ── Déconnexion ───────────────────────────────────────────────────────────
  const [showLogout, setShowLogout] = useState(false);

  // ── Fetch candidatures ────────────────────────────────────────────────────
  const fetchCandidatures = useCallback(async () => {
    setLoadingCands(true);
    setErrorCands("");
    try {
      const token = localStorage.getItem("token") || "";

      const res = await fetch(`${API_BASE}/candidatures.php`, {
        method:      "GET",
        credentials: "include",
        headers: {
          Authorization:      `Bearer ${token}`,
          Accept:             "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (res.status === 401) { logout(); return; }
      if (res.status === 403) { logout(); return; }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorCands(errData.message || "Impossible de charger vos candidatures.");
        return;
      }

      const data = await res.json();
      if (!data.success) {
        setErrorCands(data.message || "Une erreur est survenue.");
        return;
      }

      const full = data.candidatures || [];
      // Stats sur la liste complète, cartes sur les 6 premières
      setAllCandidatures(full);
      const list = full.slice(0, 6);
      setCandidatures(list);

      setVisible([]);
      list.forEach((_, i) => {
        setTimeout(() => setVisible(prev => [...prev, i]), i * 80);
      });

    } catch (err) {
      console.error("[Dashboard] fetch candidatures error:", err);
      setErrorCands("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoadingCands(false);
    }
  }, [logout]);

  useEffect(() => {
    if (loading || !session) return;
    fetchCandidatures();
  }, [loading, session, fetchCandidatures]);

  // ── Statistiques (calculées sur la liste complète) ────────────────────────
  const stats = [
    {
      n:     allCandidatures.length,
      label: "Candidatures",
    },
    {
      n:     allCandidatures.filter(c => c.statut === "en_evaluation").length,
      label: "En évaluation",
    },
    {
      n:     allCandidatures.filter(c => c.statut === "retenu_entretien" || c.statut === "entretien_valide").length,
      label: "Entretiens",
    },
    {
      n:     allCandidatures.filter(c => c.statut === "recrute").length,
      label: "Recrutés",
    },
    // ← AJOUT : regroupe non_retenu + non_retenu_cv
    {
      n:     allCandidatures.filter(c => isNonRetenu(c.statut)).length,
      label: "Non retenus",
    },
  ];

  const displayName = session?.prenoms || session?.prenom || session?.nom || "vous";

  // ── Écran de chargement session ───────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="ins-spinner" aria-label="Chargement…" />
      </div>
    );
  }

  return (
    <>
      {showLogout && (
        <LogoutModal
          onConfirm={logout}
          onCancel={() => setShowLogout(false)}
        />
      )}

      <Menu session={session} onLogout={() => setShowLogout(true)}>

        {/* ── Greeting ── */}
        <div className="db-greeting">
          <p>Voici un aperçu de vos candidatures récentes</p>
        </div>

        {/* ── Stats ── */}
        <div className="db-stats">
          {stats.map((s, i) => (
            <div key={i} className="db-stat">
              <span className="db-stat-n">
                {loadingCands ? "…" : s.n}
              </span>
              <span className="db-stat-l">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Section candidatures récentes ── */}
        <div className="db-section-head">
          <h3>Récentes candidatures</h3>
          <Link to="/candidatures" className="db-see-all">Voir tout</Link>
        </div>

        {/* ── Skeleton ── */}
        {loadingCands && (
          <div className="db-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Erreur ── */}
        {!loadingCands && errorCands && (
          <div className="db-empty" style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10, color: "#e53935" }}>
              <InlineIcon name="alert" />
            </div>
            <p style={{ color: "#e53935", marginBottom: 14 }}>{errorCands}</p>
            <button className="db-empty-cta" onClick={fetchCandidatures}>
              <InlineIcon name="refresh" /> Réessayer
            </button>
          </div>
        )}

        {/* ── Grille de cartes ── */}
        {!loadingCands && !errorCands && (
          <div className="db-grid">
            {candidatures.length === 0 ? (
              <div className="db-empty">
                <p>Aucune candidature pour le moment</p>
                <Link to="/jobs-auth" className="db-empty-cta">Explorer les offres</Link>
              </div>
            ) : (
              candidatures.map((row, index) => {
                const color  = CARD_COLORS[index % CARD_COLORS.length];
                const statut = STATUT_LABELS[row.statut] || STATUT_LABELS.en_evaluation;
                return (
                  <div
                    key={row.id}
                    className={`db-card${visible.includes(index) ? " db-card--visible" : ""}`}
                    style={{ gap: 0, padding: "18px 18px 16px" }}
                  >
                    <h4 className="db-card-title" style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                      {row.titre}
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                      <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: "none", stroke: "#9ca3af", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }}>
                        <rect x="2" y="7" width="20" height="14" rx="2"/>
                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                      </svg>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.entreprise}</span>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <span className={`db-badge ${statut.cls}`}>{statut.label}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9ca3af", marginTop: "auto", paddingTop: 4, borderTop: "1px solid #f0f2f5" }}>
                      <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: "none", stroke: "#9ca3af", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8"  y1="2" x2="8"  y2="6"/>
                        <line x1="3"  y1="10" x2="21" y2="10"/>
                      </svg>
                      {formatDate(row.Date_pub)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </Menu>
    </>
  );
}