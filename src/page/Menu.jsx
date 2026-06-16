import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import zenImg from "../assets/img/zen.png";
import "./css/notifications.css";

const API_BASE = import.meta.env.VITE_API_BASE || '';

function getSalutation() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
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

// Icône corbeille Bootstrap (SVG inline)
function IconTrash() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
    </svg>
  );
}

const NAV_LINKS = [
  { to: "/dashbord",     icon: "grid",   label: "Tableau de bord", shortLabel: "Accueil"      },
  { to: "/profil",       icon: "user",   label: "Mon profil",      shortLabel: "Profil"       },
  { to: "/candidatures", icon: "file",   label: "Candidatures",    shortLabel: "Candidatures" },
  { to: "/jobs-auth",    icon: "search", label: "Offres d'emploi", shortLabel: "Offres"       },
];

const TOPBAR_LINKS = ["/dashbord", "/jobs-auth"];

// ─── Cloche de notifications ──────────────────────────────────────────────────
function NotifBell({ session }) {
  const [open, setOpen]         = useState(false);
  const [notifs, setNotifs]     = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState(null); // id en cours de suppression
  const [panelStyle, setPanelStyle] = useState({});
  const ref    = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/notifications.php`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifs(data.notifications || []);
        setUnread(data.unread_count || 0);
      }
    } catch (err) {
      console.error("[NotifBell] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchNotifs();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const handleOpen = () => {
    const next = !open;
    if (next && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const panelWidth = Math.min(420, window.innerWidth - 16);
      const left = Math.max(8, rect.right - panelWidth);
      setPanelStyle({
        position: "fixed",
        top:  rect.bottom + 8,
        left: left,
        width: panelWidth,
      });
    }
    setOpen(next);
    if (next) fetchNotifs();
  };

  const markOne = async (id, isRead) => {
    if (isRead) return;
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`${API_BASE}/notifications.php`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "read_one", id }),
      });
    } catch (err) {
      console.error("[NotifBell] markOne error:", err);
    }
  };

  const markAll = async () => {
    if (unread === 0) return;
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
    setUnread(0);
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`${API_BASE}/notifications.php`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "read_all" }),
      });
    } catch (err) {
      console.error("[NotifBell] markAll error:", err);
    }
  };

  // ── Suppression optimiste ─────────────────────────────────────────────────
  const deleteOne = async (e, id) => {
    e.stopPropagation(); // ne pas déclencher markOne
    setDeleting(id);

    // Optimistic update immédiat
    const removed = notifs.find(n => n.id === id);
    setNotifs(prev => prev.filter(n => n.id !== id));
    if (removed && !removed.lu) setUnread(prev => Math.max(0, prev - 1));

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/notifications.php`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "delete_one", id }),
      });
      if (!res.ok) {
        // Rollback si erreur serveur
        setNotifs(prev => {
          const restored = [...prev, removed].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          return restored;
        });
        if (removed && !removed.lu) setUnread(prev => prev + 1);
      }
    } catch (err) {
      console.error("[NotifBell] deleteOne error:", err);
      // Rollback réseau
      setNotifs(prev => {
        const restored = [...prev, removed].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        return restored;
      });
      if (removed && !removed.lu) setUnread(prev => prev + 1);
    } finally {
      setDeleting(null);
    }
  };

  const typeIcon = (type, titre = "") => {
    const t = titre.toLowerCase();
    if (t.includes("félicitations") || t.includes("recrut")) return "🎉";
    if (t.includes("entretien")) return "🔔";
    if (t.includes("réserve"))   return "🔔";
    if (type === "candidature")  return "🔔";
    if (type === "info")         return "🔔";
    if (type === "alerte")       return "🔔";
    if (type === "succès")       return "🔔";
    return "🔔";
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)     return "À l'instant";
    if (diff < 3600)   return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400)  return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div className="db-notif-wrapper" ref={ref}>
      <button ref={btnRef} className="db-notif-btn" onClick={handleOpen}>
        <svg
          viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          width="20" height="20"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="db-notif-badge">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="db-notif-panel" style={panelStyle}>
          <div className="db-notif-header">
            <span className="db-notif-header-title">
              Notifications
              {unread > 0 && (
                <span className="db-notif-header-count">{unread}</span>
              )}
            </span>
            {unread > 0 && (
              <button className="db-notif-read-all" onClick={markAll}>
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="db-notif-body">
            {loading && notifs.length === 0 ? (
              <div className="db-notif-empty">
                <span className="db-notif-empty-icon">⏳</span>
                <span>Chargement…</span>
              </div>
            ) : notifs.length === 0 ? (
              <div className="db-notif-empty">
                <span className="db-notif-empty-icon">🔔</span>
                <span>Aucune notification</span>
                {session?.prenoms && (
                  <span className="db-notif-greeting">
                    {getSalutation()} {session.prenoms} !
                  </span>
                )}
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`db-notif-item${!n.lu ? " db-notif-item--unread" : ""}${deleting === n.id ? " db-notif-item--deleting" : ""}`}
                  onClick={() => markOne(n.id, n.lu)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && markOne(n.id, n.lu)}
                >
                  <span className="db-notif-item-icon">{typeIcon(n.type, n.titre)}</span>
                  <div className="db-notif-item-content">
                    <p className="db-notif-item-title">{n.titre}</p>
                    <p className="db-notif-item-msg">{n.message}</p>
                    <span className="db-notif-item-time">{timeAgo(n.created_at)}</span>
                  </div>
                  <div className="db-notif-item-actions">
                    {!n.lu && <span className="db-notif-item-dot" aria-hidden="true" />}
                    <button
                      className="db-notif-delete-btn"
                      onClick={(e) => deleteOne(e, n.id)}
                      disabled={deleting === n.id}
                      aria-label="Supprimer cette notification"
                      title="Supprimer"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Menu({ session, children, footer, onLogout }) {
  const location = useLocation();

  const initials = session
    ? `${session.prenoms?.[0] ?? ""}${session.nom?.[0] ?? ""}`
    : "??";

  return (
    <div className="db-wrapper">
      <header className="db-topbar">
        <Link to="/dashbord" className="db-topbar-logo">
          <img src={zenImg} alt="Zenselekt" />
        </Link>
        <nav className="db-topbar-nav">
          {NAV_LINKS.filter(l => TOPBAR_LINKS.includes(l.to)).map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`db-tn${location.pathname === link.to ? " db-tn--active" : ""}`}
            >
              {link.shortLabel}
            </Link>
          ))}
        </nav>
        <div className="db-topbar-right">
          <NotifBell session={session} />
          {session && (
            <>
              <span className="db-topbar-name">{session.prenoms} {session.nom}</span>
              <div className="db-avatar">{initials}</div>
            </>
          )}
        </div>
      </header>

      <div className="db-body">
        <aside className="db-sidebar">
          <div className="db-sidebar-top">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`db-si${location.pathname === link.to ? " db-si--active" : ""}`}
              >
                <SideIcon name={link.icon} />
                <span className="db-si-tip">{link.label}</span>
              </Link>
            ))}
          </div>
          <div className="db-sidebar-bottom">
            <button
              className="db-si"
              onClick={onLogout}
              aria-label="Se déconnecter"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <SideIcon name="logout" />
              <span className="db-si-tip">Déconnexion</span>
            </button>
          </div>
        </aside>
        <main className="db-main">{children}</main>
      </div>

      <nav className="db-bottom-nav">
        {NAV_LINKS.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`db-bn-item${location.pathname === link.to ? " db-bn-item--active" : ""}`}
          >
            <SideIcon name={link.icon} />
            <span>{link.shortLabel}</span>
          </Link>
        ))}
        <button
          onClick={onLogout}
          className="db-bn-item db-bn-item--logout"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <SideIcon name="logout" />
          <span>Déconnexion</span>
        </button>
      </nav>

      {footer ?? (
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
      )}
    </div>
  );
}