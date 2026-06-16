// useSessionGuard.jsx — Zenselekt
// CORRIGÉ : routes alignées sur connexion.php (routeur par chemin URL)

import { useReducer, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const INITIAL = { session: null, loading: true, isBlocked: false };

function reducer(state, action) {
  switch (action.type) {
    case "READY":   return { ...state, session: action.session, loading: false, isBlocked: false };
    case "BLOCKED": return { ...state, session: null,           loading: false, isBlocked: true  };
    case "LOGOUT":  return { ...state, session: null,           loading: false, isBlocked: false };
    default:        return state;
  }
}

function readLocalSession() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function readToken()        { return localStorage.getItem("token") || ""; }
function clearLocalSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  sessionStorage.clear();
}

export function useSessionGuard({
  redirectTo    = "/connexion",
  checkInterval = 0,
  onSessionExpired,
} = {}) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const redirectedRef = useRef(false);
  const intervalRef   = useRef(null);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const token = readToken();
    if (token) {
      try {
        // ✅ Route correcte : /deconnexion (POST)
        await fetch(`${API_BASE}/deconnexion`, {
          method:      "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept:        "application/json",
          },
        });
      } catch { /* best-effort */ }
    }
    clearLocalSession();
    dispatch({ type: "LOGOUT" });
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo]);

  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  // ── Vérification serveur ──────────────────────────────────────────────────
  const verifyServerStatus = useCallback(async () => {
    const token = readToken();
    if (!token) return false;

    try {
      // ✅ Route correcte : /session/verifier (GET)
      const res = await fetch(`${API_BASE}/session/verifier`, {
        credentials: "include",
        headers: {
          Accept:             "application/json",
          Authorization:      `Bearer ${token}`,
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (res.status >= 500) return true;   // erreur serveur → tolérance
      if (res.status === 403) return false; // compte bloqué
      if (res.status === 401) return false; // token invalide/expiré
      if (!res.ok)            return true;  // autre erreur → tolérance

      const data = await res.json();
      if (!data.success) return false;

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return data.user || true;
    } catch {
      return true; // réseau coupé → tolérance
    }
  }, []);

  // ── Initialisation ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const localUser = readLocalSession();
      const token     = readToken();

      if (!localUser || !localUser.email || !token) {
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          onSessionExpired?.();
          dispatch({ type: "LOGOUT" });
          navigate(redirectTo, { replace: true });
        }
        return;
      }

      const result = await verifyServerStatus();
      if (cancelled) return;

      if (!result) {
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          clearLocalSession();
          onSessionExpired?.();
          dispatch({ type: "LOGOUT" });
          navigate(redirectTo, { replace: true });
        }
        return;
      }

      const freshUser = typeof result === "object" ? result : localUser;
      dispatch({ type: "READY", session: freshUser });
    };

    init();
    return () => { cancelled = true; };
  }, [navigate, redirectTo, onSessionExpired, verifyServerStatus]);

  // ── Vérification périodique ───────────────────────────────────────────────
  useEffect(() => {
    if (!checkInterval || checkInterval <= 0) return;

    intervalRef.current = setInterval(async () => {
      const localUser = readLocalSession();
      if (!localUser || !readToken()) {
        clearInterval(intervalRef.current);
        logoutRef.current();
        return;
      }
      const result = await verifyServerStatus();
      if (!result) {
        clearInterval(intervalRef.current);
        clearLocalSession();
        onSessionExpired?.();
        dispatch({ type: "LOGOUT" });
        navigate(redirectTo, { replace: true });
      } else if (typeof result === "object") {
        dispatch({ type: "READY", session: result });
      }
    }, checkInterval);

    return () => clearInterval(intervalRef.current);
  }, [checkInterval, navigate, redirectTo, onSessionExpired, verifyServerStatus]);

  // ── Multi-onglets ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleStorage = (e) => {
      if ((e.key === "user" || e.key === "token") && e.newValue === null) {
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          dispatch({ type: "LOGOUT" });
          navigate(redirectTo, { replace: true });
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [navigate, redirectTo]);

  return { session: state.session, loading: state.loading, isBlocked: state.isBlocked, logout };
}