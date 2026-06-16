import { useState, useEffect, useCallback } from "react";
import Menu from "./Menu";
import { useSessionGuard } from "../auth/useSessionGuard.jsx";
import "./css/dashboard.css";
import "./css/candidatures.css";

// ─── Constantes ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || '';

const CARD_COLORS = [
    { bg: "#eeedfe", stroke: "#534ab7", icon: "rocket" },
    { bg: "#faeeda", stroke: "#854f0b", icon: "chart" },
    { bg: "#e6f1fb", stroke: "#185fa5", icon: "bar" },
    { bg: "#fcebeb", stroke: "#a32d2d", icon: "users" },
    { bg: "#f1efe8", stroke: "#5f5e5a", icon: "briefcase" },
    { bg: "#eaf3de", stroke: "#3b6d11", icon: "cog" },
];

const STATUT_LABELS = {
    en_evaluation:    { label: "En cours d'évaluation", cls: "badge-evaluation"  },
    retenu_entretien: { label: "Retenu pour entretien",  cls: "badge-entretien"   },
    entretien_valide: { label: "Entretien validé",        cls: "badge-valide"      },
    non_retenu_cv:    { label: "CV non retenu",           cls: "badge-non-retenu"  },
    non_retenu:       { label: "Non retenu",              cls: "badge-non-retenu"  },
    reserve:          { label: "Mis en réserve",          cls: "badge-reserve"     },
    recrute:          { label: "Recruté",                 cls: "badge-recrute"     },
};

const ALL_STATUTS = [
    { value: "tous",             label: "Tous les statuts"       },
    { value: "en_evaluation",    label: "En cours d'évaluation"  },
    { value: "retenu_entretien", label: "Retenu pour entretien"  },
    { value: "entretien_valide", label: "Entretien validé"       },
    { value: "non_retenu_cv",    label: "CV non retenu"          },
    { value: "non_retenu",       label: "Non retenu"             },
    { value: "reserve",          label: "Mis en réserve"         },
    { value: "recrute",          label: "Recruté"                },
];

// ── STAT_KEYS : "non_retenu_all" regroupe non_retenu + non_retenu_cv ──────────
const STAT_KEYS = ["tous", "en_evaluation", "retenu_entretien", "recrute", "non_retenu_all"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

// ─── Modal déconnexion ────────────────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
    return (
        <div className="db-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-title">
            <div className="db-modal">
                <div className="db-modal-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

// ─── Icônes inline ────────────────────────────────────────────────────────────
function IconSVG({ name, stroke }) {
    const s = { fill: "none", stroke, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
    if (name === "briefcase") return (
        <svg viewBox="0 0 24 24" style={s}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
    );
    if (name === "chart") return (
        <svg viewBox="0 0 24 24" style={s}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    );
    if (name === "bar") return (
        <svg viewBox="0 0 24 24" style={s}>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6"  y1="20" x2="6"  y2="14" />
        </svg>
    );
    if (name === "users") return (
        <svg viewBox="0 0 24 24" style={s}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
    if (name === "cog") return (
        <svg viewBox="0 0 24 24" style={s}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    );
    if (name === "rocket") return (
        <svg viewBox="0 0 24 24" style={s}>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        </svg>
    );
    return null;
}

function InlineIcon({ name }) {
    const s = { fill: "none", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
    if (name === "briefcase") return (
        <svg viewBox="0 0 24 24" style={s}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
    );
    if (name === "calendar") return (
        <svg viewBox="0 0 24 24" style={s}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8"  y1="2" x2="8"  y2="6" />
            <line x1="3"  y1="10" x2="21" y2="10" />
        </svg>
    );
    if (name === "x") return (
        <svg viewBox="0 0 24 24" style={s}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6"  y1="6" x2="18" y2="18" />
        </svg>
    );
    if (name === "eye") return (
        <svg viewBox="0 0 24 24" style={s}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
    if (name === "filter") return (
        <svg viewBox="0 0 24 24" style={s}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
    if (name === "search") return (
        <svg viewBox="0 0 24 24" style={s}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
    if (name === "list") return (
        <svg viewBox="0 0 24 24" style={s}>
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    );
    if (name === "grid2") return (
        <svg viewBox="0 0 24 24" style={s}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
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

// ─── Modal détail candidature ─────────────────────────────────────────────────
function DetailModal({ candidature, onClose, colorIndex }) {
    const color  = CARD_COLORS[colorIndex % CARD_COLORS.length];
    const statut = STATUT_LABELS[candidature.statut] || STATUT_LABELS.en_evaluation;

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const steps    = [
        { key: "en_evaluation",    label: "Évaluation" },
        { key: "retenu_entretien", label: "Entretien"  },
        { key: "entretien_valide", label: "Validé"     },
        { key: "recrute",          label: "Recruté"    },
    ];
    const stepOrder  = ["en_evaluation", "retenu_entretien", "entretien_valide", "recrute"];
    const currentIdx = stepOrder.indexOf(candidature.statut);

    // Les statuts considérés comme "refus" ou "réserve" (pas de timeline)
    const isRejected = ["non_retenu", "non_retenu_cv", "reserve"].includes(candidature.statut);

    return (
        <div className="cd-modal-overlay" onClick={onClose}>
            <div className="cd-modal" onClick={e => e.stopPropagation()}>
                <button className="cd-modal-close" onClick={onClose}>
                    <InlineIcon name="x" />
                </button>

                <div className="cd-modal-header">
                    <div>
                        <h2 className="cd-modal-title">{candidature.titre}</h2>
                    </div>
                </div>

                <div className="cd-modal-meta">
                    <span className="cd-modal-meta-item">
                        Postulé le {formatDate(candidature.Date_pub)}
                    </span>
                    <span className={`db-badge ${statut.cls}`}>{statut.label}</span>
                </div>

                {!isRejected && (
                    <div className="cd-timeline">
                        {steps.map((step, i) => {
                            const done    = i <= currentIdx;
                            const current = i === currentIdx;
                            return (
                                <div
                                    key={step.key}
                                    className={`cd-step${done ? " cd-step--done" : ""}${current ? " cd-step--current" : ""}`}
                                >
                                    <div className="cd-step-dot" />
                                    {i < steps.length - 1 && <div className="cd-step-line" />}
                                    <span className="cd-step-label">{step.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {isRejected && (
                    <div className={`cd-modal-notice ${candidature.statut === "reserve" ? "cd-modal-notice--gray" : "cd-modal-notice--red"}`}>
                        {candidature.statut === "reserve"
                            ? "Votre profil a été mis en réserve et pourra être consulté pour de futures opportunités."
                            : candidature.statut === "non_retenu_cv"
                                ? "Votre CV n'a pas été retenu pour ce poste."
                                : "Votre candidature n'a pas été retenue pour ce poste."}
                    </div>
                )}

                <div className="cd-modal-footer">
                    {candidature.offre_id && (
                        <a
                            href={`/jobs-auth/${candidature.offre_id}`}
                            className="cd-modal-btn cd-modal-btn--secondary"
                        >
                            Voir l'offre
                        </a>
                    )}
                    <button className="cd-modal-btn" onClick={onClose}>Fermer</button>
                </div>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Candidatures() {

    // ── Session (même pattern que Profil) ─────────────────────────────────────
    const { session, loading: sessionLoading, logout } = useSessionGuard({
        redirectTo:    "/connexion",
        checkInterval: 5 * 60 * 1000,
    });

    const [showLogout, setShowLogout] = useState(false);

    // ── État candidatures ─────────────────────────────────────────────────────
    const [candidatures, setCandidatures] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState("");

    const [search,      setSearch]      = useState("");
    const [filterStat,  setFilterStat]  = useState("tous");
    const [viewMode,    setViewMode]    = useState("grid");
    const [visible,     setVisible]     = useState([]);
    const [selected,    setSelected]    = useState(null);

    // ── Fetch candidatures ────────────────────────────────────────────────────
    const fetchCandidatures = useCallback(async () => {
        setLoading(true);
        setError("");
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
                setError(errData.message || "Impossible de charger vos candidatures. Veuillez réessayer.");
                return;
            }

            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Une erreur est survenue.");
                return;
            }

            const list = data.candidatures || [];
            setCandidatures(list);

            setVisible([]);
            list.forEach((_, i) => {
                setTimeout(() => setVisible(prev => [...prev, i]), i * 60);
            });

        } catch (err) {
            console.error("[Candidatures] fetch error:", err);
            setError("Erreur réseau. Vérifiez votre connexion.");
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        if (sessionLoading || !session) return;
        fetchCandidatures();
    }, [sessionLoading, session, fetchCandidatures]);

    // ── Filtres ───────────────────────────────────────────────────────────────
    // Helpers : est-ce que ce statut est "non retenu" (toutes variantes) ?
    const isNonRetenu = (statut) => statut === "non_retenu" || statut === "non_retenu_cv";

    const filtered = candidatures.filter(c => {
        const matchSearch =
            c.titre.toLowerCase().includes(search.toLowerCase()) ||
            c.entreprise.toLowerCase().includes(search.toLowerCase());

        let matchStatut;
        if (filterStat === "tous") {
            matchStatut = true;
        } else if (filterStat === "non_retenu_all") {
            // ← FIX : regroupe les deux variantes de refus
            matchStatut = isNonRetenu(c.statut);
        } else {
            matchStatut = c.statut === filterStat;
        }

        return matchSearch && matchStatut;
    });

    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = [
        { n: candidatures.length,
          label: "Total" },
        { n: candidatures.filter(c => c.statut === "en_evaluation").length,
          label: "En évaluation" },
        { n: candidatures.filter(c => c.statut === "retenu_entretien" || c.statut === "entretien_valide").length,
          label: "Entretiens" },
        { n: candidatures.filter(c => c.statut === "recrute").length,
          label: "Recrutés" },
        { n: candidatures.filter(c => isNonRetenu(c.statut)).length,
          label: "Non retenus" },
    ];

    // ── Chargement session ────────────────────────────────────────────────────
    if (sessionLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <div className="ins-spinner" aria-label="Chargement…" />
            </div>
        );
    }

    // ── Rendu erreur data ─────────────────────────────────────────────────────
    if (!loading && error) {
        return (
            <>
                {showLogout && (
                    <LogoutModal
                        onConfirm={logout}
                        onCancel={() => setShowLogout(false)}
                    />
                )}
                <Menu session={session} onLogout={() => setShowLogout(true)}>
                    <div className="db-greeting">
                        <h2>Mes candidatures</h2>
                    </div>
                    <div className="db-empty" style={{ padding: "48px 0", textAlign: "center" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>
                            <InlineIcon name="alert" />
                        </div>
                        <p style={{ color: "#e53935", marginBottom: 16 }}>{error}</p>
                        <button className="db-empty-cta" onClick={fetchCandidatures}>
                            <InlineIcon name="refresh" /> Réessayer
                        </button>
                    </div>
                </Menu>
            </>
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

                {/* Greeting */}
                <div className="db-greeting">
                    <h2>Mes candidatures</h2>
                    <p>Suivez l'avancement de toutes vos candidatures</p>
                </div>

                {/* Stats cliquables */}
                <div className="db-stats cd-stats">
                    {stats.map((s, i) => (
                        <div
                            key={i}
                            className={`db-stat cd-stat-pill${filterStat === STAT_KEYS[i] ? " cd-stat-pill--active" : ""}`}
                            onClick={() => setFilterStat(STAT_KEYS[i])}
                            style={{ cursor: "pointer" }}
                        >
                            <span className="db-stat-n">{loading ? "…" : s.n}</span>
                            <span className="db-stat-l">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Barre de recherche + filtres */}
                <div className="cd-toolbar">
                    <div className="cd-search-wrapper">
                        <span className="cd-search-ico"><InlineIcon name="search" /></span>
                        <input
                            className="cd-search"
                            type="text"
                            placeholder="Rechercher un poste, une entreprise…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            disabled={loading}
                        />
                        {search && (
                            <button className="cd-search-clear" onClick={() => setSearch("")}>
                                <InlineIcon name="x" />
                            </button>
                        )}
                    </div>

                    <div className="cd-filter-wrapper">
                        <span className="cd-filter-ico"><InlineIcon name="filter" /></span>
                        <select
                            className="cd-filter-select"
                            value={filterStat}
                            onChange={e => setFilterStat(e.target.value)}
                            disabled={loading}
                        >
                            {ALL_STATUTS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="cd-view-toggle">
                        <button
                            className={`cd-view-btn${viewMode === "grid" ? " cd-view-btn--active" : ""}`}
                            onClick={() => setViewMode("grid")}
                            title="Vue grille"
                        >
                            <InlineIcon name="grid2" />
                        </button>
                        <button
                            className={`cd-view-btn${viewMode === "list" ? " cd-view-btn--active" : ""}`}
                            onClick={() => setViewMode("list")}
                            title="Vue liste"
                        >
                            <InlineIcon name="list" />
                        </button>
                    </div>
                </div>

                {/* Compteur résultats */}
                {!loading && (
                    <div className="cd-result-count">
                        {filtered.length} candidature{filtered.length !== 1 ? "s" : ""}
                        {(filterStat !== "tous" || search) && (
                            <>
                                {" · "}
                                {filterStat === "non_retenu_all"
                                    ? "Non retenus"
                                    : filterStat !== "tous"
                                        ? STATUT_LABELS[filterStat]?.label
                                        : ""}
                                {search ? ` "${search}"` : ""}
                            </>
                        )}
                    </div>
                )}

                {/* ── Skeleton ── */}
                {loading && (
                    <div className="db-grid cd-grid">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* ── Vue GRILLE ── */}
                {!loading && viewMode === "grid" && (
                    <div className="db-grid cd-grid">
                        {filtered.length === 0 ? (
                            <div className="db-empty">
                                <p>
                                    {candidatures.length === 0
                                        ? "Vous n'avez pas encore postulé à une offre."
                                        : "Aucune candidature ne correspond à votre recherche"}
                                </p>
                                {candidatures.length === 0 ? (
                                    <a href="/jobs-auth" className="db-empty-cta">Voir les offres</a>
                                ) : (
                                    <button
                                        className="db-empty-cta"
                                        onClick={() => { setSearch(""); setFilterStat("tous"); }}
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                )}
                            </div>
                        ) : (
                            filtered.map((row) => {
                                const globalIdx = candidatures.findIndex(c => c.id === row.id);
                                const color     = CARD_COLORS[globalIdx % CARD_COLORS.length];
                                const statut    = STATUT_LABELS[row.statut] || STATUT_LABELS.en_evaluation;
                                return (
                                    <div
                                        key={row.id}
                                        className={`db-card cd-card${visible.includes(globalIdx) ? " db-card--visible" : ""}`}
                                        onClick={() => setSelected({ ...row, colorIndex: globalIdx })}
                                    >
                                        <h4 className="db-card-title">{row.titre}</h4>
                                        <div className="cd-card-company">
                                            <InlineIcon name="briefcase" />
                                            <span>{row.entreprise}</span>
                                        </div>
                                        <div className="db-card-meta">
                                            <span className={`db-badge ${statut.cls}`}>{statut.label}</span>
                                        </div>
                                        <div className="cd-card-footer">
                                            <span className="db-card-date">
                                                <InlineIcon name="calendar" />
                                                {formatDate(row.Date_pub)}
                                            </span>
                                            <span className="cd-card-detail">
                                                <InlineIcon name="eye" />
                                                Détails
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ── Vue LISTE ── */}
                {!loading && viewMode === "list" && (
                    <div className="cd-list">
                        {filtered.length === 0 ? (
                            <div className="db-empty">
                                <p>
                                    {candidatures.length === 0
                                        ? "Vous n'avez pas encore postulé à une offre."
                                        : "Aucune candidature ne correspond à votre recherche"}
                                </p>
                                {candidatures.length === 0 ? (
                                    <a href="/jobs-auth" className="db-empty-cta">Voir les offres</a>
                                ) : (
                                    <button
                                        className="db-empty-cta"
                                        onClick={() => { setSearch(""); setFilterStat("tous"); }}
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                )}
                            </div>
                        ) : (
                            filtered.map((row) => {
                                const globalIdx = candidatures.findIndex(c => c.id === row.id);
                                const color     = CARD_COLORS[globalIdx % CARD_COLORS.length];
                                const statut    = STATUT_LABELS[row.statut] || STATUT_LABELS.en_evaluation;
                                return (
                                    <div
                                        key={row.id}
                                        className={`cd-list-row${visible.includes(globalIdx) ? " cd-list-row--visible" : ""}`}
                                        onClick={() => setSelected({ ...row, colorIndex: globalIdx })}
                                    >
                                        <div className="cd-list-ico" style={{ background: color.bg }}>
                                            <IconSVG name={color.icon} stroke={color.stroke} />
                                        </div>
                                        <div className="cd-list-info">
                                            <span className="cd-list-titre">{row.titre}</span>
                                            <span className="cd-list-sub">
                                                <InlineIcon name="briefcase" /> {row.entreprise}
                                            </span>
                                        </div>
                                        <div className="cd-list-badges">
                                            <span className={`db-badge ${statut.cls}`}>{statut.label}</span>
                                        </div>
                                        <span className="cd-list-date">
                                            <InlineIcon name="calendar" />
                                            {formatDate(row.Date_pub)}
                                        </span>
                                        <span className="cd-list-arrow">
                                            <InlineIcon name="eye" />
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ── Modal ── */}
                {selected && (
                    <DetailModal
                        candidature={selected}
                        colorIndex={selected.colorIndex}
                        onClose={() => setSelected(null)}
                    />
                )}

            </Menu>
        </>
    );
}