import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || '';
const _cache = {};

export function useCompatibility(jobId, token) {
  const [state, setState] = useState({
    score: null, label: null,
    points_forts: [], points_faibles: [],
    resume: '', loading: false, error: null
  });
  const abortRef = useRef(null);

  useEffect(() => {
    if (!jobId || !token) return;
    if (_cache[jobId]) {
      setState({ ...(_cache[jobId]), loading: false, error: null });
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState(s => ({ ...s, loading: true, error: null }));

    fetch(`${API_BASE}/match.php?job_id=${jobId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Erreur analyse');
        const result = {
          score:          data.score,
          label:          data.label,
          points_forts:   data.points_forts   || [],
          points_faibles: data.points_faibles || [],
          resume:         data.resume         || '',
        };
        _cache[jobId] = result;
        setState({ ...result, loading: false, error: null });
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setState(s => ({ ...s, loading: false, error: err.message }));
      });

    return () => controller.abort();
  }, [jobId, token]);

  return state;
}

// ─── Tooltip rendu dans un Portal (document.body) pour éviter tout clipping ──
import { createPortal } from "react-dom";

function TooltipPortal({ style, points_forts, points_faibles, resume }) {
  return createPortal(
    <div className="jb-compat-tooltip" style={style}>
      {resume && (
        <p className="jb-compat-tooltip-resume">{resume}</p>
      )}
      {points_forts.length > 0 && (
        <div className="jb-compat-tooltip-section">
          <span className="jb-compat-tooltip-title jb-compat-tooltip-title--ok">
             Points forts
          </span>
          <ul>
            {points_forts.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}
      {points_faibles.length > 0 && (
        <div className="jb-compat-tooltip-section">
          <span className="jb-compat-tooltip-title jb-compat-tooltip-title--warn">
             À améliorer
          </span>
          <ul>
            {points_faibles.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}
    </div>,
    document.body
  );
}

export function CompatibilityBadge({ jobId, token, compact = false }) {
  const { score, label, points_forts, points_faibles, resume, loading, error } =
    useCompatibility(jobId, token);

  const [tooltipStyle, setTooltipStyle] = useState(null);
  const badgeRef = useRef(null);

  // Fermer le tooltip si on scrolle ou resize
  useEffect(() => {
    function hide() { setTooltipStyle(null); }
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, []);

  if (loading) {
    return (
      <div className="jb-compat-loading" title="Analyse en cours…">
        <span className="jb-compat-spinner" />
        {!compact && <span>Analyse IA…</span>}
      </div>
    );
  }

  if (error || score === null) return null;

  const color  = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626';
  const bg     = score >= 70 ? '#f0fdf4' : score >= 45 ? '#fffbeb' : '#fef2f2';
  const border = score >= 70 ? '#bbf7d0' : score >= 45 ? '#fde68a' : '#fecaca';

  // ── Vue LISTE : badge compact ──────────────────────────────────────────────
  if (compact) {
    return (
      <span
        className="jb-compat-compact"
        style={{ color, background: bg, border: `1px solid ${border}` }}
        title={resume}
      >
        Compatibilité&nbsp;: {score}%&nbsp;{label}
      </span>
    );
  }

  // ── Vue GRILLE / MODAL ────────────────────────────────────────────────────
  const hasTooltip = points_forts.length > 0 || points_faibles.length > 0 || resume;

  function handleMouseEnter() {
    if (!hasTooltip || !badgeRef.current) return;
    const rect     = badgeRef.current.getBoundingClientRect();
    const gap      = 8;
    const margin   = 8;
    const vw       = window.innerWidth;
    const vh       = window.innerHeight;
    const tooltipW = Math.min(260, vw - margin * 2);

    // Horizontal
    let left = rect.left;
    if (left + tooltipW + margin > vw) left = vw - tooltipW - margin;
    left = Math.max(margin, left);

    // Vertical : choisir le côté avec le plus d'espace
    const spaceAbove = rect.top - gap - margin;
    const spaceBelow = vh - rect.bottom - gap - margin;

    let style;
    if (spaceAbove >= spaceBelow) {
      style = {
        bottom:    vh - rect.top + gap,
        left,
        top:       'unset',
        maxHeight: Math.max(80, spaceAbove),
        width:     tooltipW,
      };
    } else {
      style = {
        top:       rect.bottom + gap,
        left,
        bottom:    'unset',
        maxHeight: Math.max(80, spaceBelow),
        width:     tooltipW,
      };
    }

    setTooltipStyle(style);
  }

  return (
    <div
      className="jb-compat-wrap"
      ref={badgeRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setTooltipStyle(null)}
    >
      {/* Badge */}
      <div
        className="jb-compat-badge"
        style={{ color, background: bg, border: `1px solid ${border}` }}
      >
       
        <span className="jb-compat-score">Compatibilité&nbsp;: {score}%</span>
        <span className="jb-compat-label">{label}</span>
      </div>

      {/* Tooltip rendu dans document.body → jamais coupé par modal/overflow */}
      {tooltipStyle && hasTooltip && (
        <TooltipPortal
          style={tooltipStyle}
          points_forts={points_forts}
          points_faibles={points_faibles}
          resume={resume}
        />
      )}
    </div>
  );
}