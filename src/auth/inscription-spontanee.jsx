import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import zenImg from "../assets/img/zen.png";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE =
  import.meta.env.VITE_API_BASE || "https://app.zenselekt.com/backoffice";

const API_URL = `${API_BASE}/inscription-spontanee`;

const SECTEURS = [
  "Agriculture / Élevage / Pêche", "Agroalimentaire",
  "Architecture / Urbanisme / Design", "Art / Culture / Spectacle",
  "Artisanat / Métiers manuels", "Audit / Expertise comptable",
  "Bailleur / Organisme international", "Banque / Assurance / Microfinance",
  "Bois / Papier / Carton / Imprimerie", "BTP / Matériaux de construction",
  "Chimie / Parachimie", "Commerce / Négoce / Distribution",
  "Communication / Marketing / Publicité", "Droit / Juridique / Notariat",
  "Économie / Statistiques / Recherche", "Édition / Multimédia / Presse",
  "Education / Formation / Enseignement", "Électronique / Électricité / Énergie",
  "Environnement / Développement durable", "Études et conseils / Consulting",
  "Finance / Comptabilité / Gestion", "Hôtellerie / Restauration / Tourisme",
  "Humanitaire / ONG / Associatif", "Immobilier / Foncier",
  "Industrie pharmaceutique", "Informatique / Télécoms / Numérique",
  "Machines et équipements / Automobile", "Management / Direction générale",
  "Mines / Pétrole / Énergie", "Métallurgie / Travail du métal",
  "Plastique / Caoutchouc", "Ressources humaines / Recrutement",
  "Santé / Médical / Paramédical", "Sécurité / Défense / Gardiennage",
  "Services aux entreprises / Facilities", "Sport / Bien-être / Loisirs",
  "Textile / Habillement / Chaussure", "Transports / Logistique / Supply Chain",
  "Autre / Non classifié",
];

const NIVEAUX = [
  { value: "cepe",           label: "CEPE (Certificat d'études primaires)" },
  { value: "bepc",           label: "BEPC / Brevet" },
  { value: "cap",            label: "CAP" },
  { value: "bac",            label: "Baccalauréat" },
  { value: "bt",             label: "BT (Brevet de technicien)" },
  { value: "bp",             label: "BP (Brevet professionnel)" },
  { value: "bts",            label: "BTS" },
  { value: "dut",            label: "DUT" },
  { value: "dts",            label: "DTS" },
  { value: "deug",           label: "DEUG / DEUST (Bac +2)" },
  { value: "licence",        label: "Licence / Bachelor (Bac +3)" },
  { value: "licence_pro",    label: "Licence professionnelle (Bac +3)" },
  { value: "master",         label: "Master 1 (Bac +4)" },
  { value: "master2",        label: "Master 2 / DEA / DESS (Bac +5)" },
  { value: "ingenieur",      label: "Diplôme d'ingénieur (Bac +5)" },
  { value: "grandes_ecoles", label: "Grande École (Bac +5)" },
  { value: "doctorat",       label: "Doctorat / PhD (Bac +8)" },
  { value: "autre",          label: "Autre / Non précisé" },
];

const COMMUNES = [
  "Abobo","Adjamé","Attécoubé","Cocody","Koumassi","Marcory","Plateau",
  "Port-Bouët","Treichville","Yopougon","Aboisso","Adzopé","Agboville",
  "Bouaké","Bondoukou","Dabou","Daloa","Daoukro","Dimbokro","Divo",
  "Ferkessédougou","Gagnoa","Grand-Bassam","Guiglo","Issia","Jacqueville",
  "Katiola","Korhogo","Man","Minignan","Odienné","San-Pédro","Sassandra",
  "Séguéla","Soubré","Tabou","Toumodi","Yamoussoukro",
  "Autres / Hors Côte d'Ivoire",
];

const STEPS = ["CV", "Informations", "Professionnel", "Documents"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

// ─── CSRF helpers ─────────────────────────────────────────────────────────────
let _csrfToken = null;

async function fetchCsrfToken() {
  try {
    const res = await fetch(`${API_URL}?action=csrf-token`, {
      method:      "GET",
      credentials: "include",
      headers:     { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Échec récupération CSRF");
    const data = await res.json();
    _csrfToken = data.csrf_token ?? null;
  } catch (err) {
    console.error("[CSRF] fetchCsrfToken:", err);
    _csrfToken = null;
  }
}

function refreshCsrfFromResponse(response) {
  const newToken = response.headers.get("X-CSRF-Token-New");
  if (newToken) _csrfToken = newToken;
}

// ─── Rate limit client ────────────────────────────────────────────────────────
const RATE_LIMIT_KEY   = "spontanee_rate_limit";
const MAX_ATTEMPTS     = 3;
const LOCKOUT_DURATION = 24 * 60 * 60 * 1000;

function getRateLimitData() {
  try {
    const data = localStorage.getItem(RATE_LIMIT_KEY);
    return data ? JSON.parse(data) : { attempts: 0, blockedUntil: null };
  } catch { return { attempts: 0, blockedUntil: null }; }
}
function setRateLimitData(attempts, blockedUntil) {
  try { localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ attempts, blockedUntil })); }
  catch { console.warn("Impossible d'accéder à localStorage"); }
}
function isRateLimited() {
  const { blockedUntil } = getRateLimitData();
  if (!blockedUntil) return false;
  if (Date.now() < blockedUntil) return true;
  setRateLimitData(0, null);
  return false;
}
function getTimeUntilUnlock() {
  const { blockedUntil } = getRateLimitData();
  if (!blockedUntil) return null;
  const remaining = blockedUntil - Date.now();
  if (remaining <= 0) { setRateLimitData(0, null); return null; }
  return Math.ceil(remaining / (60 * 60 * 1000));
}
function recordFailedAttempt() {
  let { attempts, blockedUntil } = getRateLimitData();
  attempts += 1;
  if (attempts >= MAX_ATTEMPTS) blockedUntil = Date.now() + LOCKOUT_DURATION;
  setRateLimitData(attempts, blockedUntil);
}
function resetRateLimit() { setRateLimitData(0, null); }

// ─── Validation ───────────────────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}
function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 && /^[+\d\s\-().]+$/.test(phone);
}
function validateFile(file, allowedExts) {
  if (!file) return { ok: false, error: "Aucun fichier sélectionné." };
  const ext = file.name.split(".").pop().toLowerCase();
  if (!allowedExts.includes(ext))
    return { ok: false, error: `Extension non autorisée. Formats : ${allowedExts.join(", ").toUpperCase()}.` };
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: "Le fichier ne doit pas dépasser 10 Mo." };
  if (file.size === 0) return { ok: false, error: "Le fichier est vide." };
  return { ok: true };
}

const CV_EXTS      = ["pdf", "doc", "docx"];
const LETTRE_EXTS  = ["pdf", "doc", "docx"];
const DIPLOME_EXTS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];

function sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
}

function mapGenre(g) {
  if (!g) return "";
  const l = g.toLowerCase();
  if (l === "homme" || l === "male" || l === "m") return "homme";
  if (l === "femme" || l === "female" || l === "f") return "femme";
  return "";
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="ins-steps" role="list" aria-label="Étapes du formulaire">
      {STEPS.map((label, i) => (
        <div
          key={i}
          className={`ins-step${i < current ? " done" : i === current ? " active" : ""}`}
          role="listitem"
          aria-current={i === current ? "step" : undefined}
        >
          <div className="ins-step__dot">
            {i < current ? <i className="fas fa-check" aria-hidden="true" /> : i + 1}
          </div>
          <span className="ins-step__label">{label}</span>
          {i < STEPS.length - 1 && <div className="ins-step__line" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

// ─── Field / Input / Select ───────────────────────────────────────────────────
function Field({ label, required, children, hint, htmlFor }) {
  return (
    <div className="ins-field">
      <label className="ins-label" htmlFor={htmlFor}>
        {label}{" "}
        {required && <span className="ins-required" aria-label="champ obligatoire">*</span>}
      </label>
      {children}
      {hint && <small className="ins-hint" role="note">{hint}</small>}
    </div>
  );
}
function Input({ id, value, onChange, type = "text", placeholder, min, max, required, maxLength = 255, autoComplete }) {
  return (
    <input
      id={id} className="ins-input" type={type} value={value}
      onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
      placeholder={placeholder} min={min} max={max} required={required}
      maxLength={maxLength} autoComplete={autoComplete || "off"} spellCheck={false}
    />
  );
}
function Select({ id, value, onChange, options, placeholder = "Sélectionner", required }) {
  return (
    <select id={id} className="ins-input ins-select" value={value}
      onChange={(e) => onChange(e.target.value)} required={required}>
      <option value="">{placeholder}</option>
      {options.map((opt) =>
        typeof opt === "string"
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
  );
}

// ─── Step 0 — CV Upload ───────────────────────────────────────────────────────
function StepCV({ onNext, cvFile, setCvFile, setCvToken, onCvData }) {
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const validation = validateFile(file, CV_EXTS);
    if (!validation.ok) {
      Swal.fire({ icon: "error", title: "Fichier invalide", text: validation.error });
      return;
    }

    setCvFile(file);
    setLoading(true);

    // ─── CORRECTION : s'assurer que le token CSRF est disponible avant l'upload
    if (!_csrfToken) {
      await fetchCsrfToken();
      if (!_csrfToken) {
        Swal.fire({
          icon: "error",
          title: "Erreur de session",
          text: "Impossible d'obtenir un token de sécurité. Veuillez recharger la page.",
        });
        setCvFile(null);
        setLoading(false);
        return;
      }
    }

    try {
      const fd = new FormData();
      fd.append("action",    "upload_cv");
      fd.append("Fichier_cv", file);
      fd.append("csrf_token", _csrfToken ?? "");

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 60000);

      let res;
      try {
        res = await fetch(API_URL, {
          method:      "POST",
          credentials: "include",
          headers:     { Accept: "application/json", "X-CSRF-Token": _csrfToken ?? "" },
          body:        fd,
          signal:      controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Rotation CSRF
      refreshCsrfFromResponse(res);

      // Session expirée → recharger le token silencieusement puis avertir
      if (res.status === 403) {
        await fetchCsrfToken();
        Swal.fire({ icon: "error", title: "Session expirée", text: "Veuillez réessayer." });
        setCvFile(null);
        setLoading(false);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const raw = await res.text();
        console.error("[CV-UPLOAD] Réponse non-JSON:", raw.slice(0, 500));
        Swal.fire({ icon: "error", title: "Erreur serveur", text: "Le serveur a retourné une réponse inattendue. Consultez les logs PHP." });
        setCvFile(null);
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = Array.isArray(data.errors) ? data.errors[0]
          : (data.errors && Object.values(data.errors)[0]) || data.message || "Erreur lors de l'upload.";
        Swal.fire({ icon: "error", title: "Upload échoué", text: msg });
        setCvFile(null);
        setLoading(false);
        return;
      }

      if (data.extraction_failed) {
        Swal.fire({ icon: "error", title: "Lecture impossible", text: "Essayez de convertir votre CV en PDF." });
        setCvFile(null);
        setLoading(false);
        return;
      }

      if (!data.is_valid_cv) {
        Swal.fire({ icon: "error", title: "CV invalide", text: data.errors?.[0] || "Ce document ne ressemble pas à un CV valide." });
        setCvFile(null);
        setLoading(false);
        return;
      }

      if (data.success) {
        setCvToken(data.cv_token);
        onCvData(data.data);
        Swal.fire({ icon: "success", title: "CV analysé", text: "Les informations ont été extraites automatiquement.", timer: 2000, showConfirmButton: false });
      } else {
        Swal.fire({ icon: "error", title: "Erreur analyse", text: data.errors?.[0] || "Veuillez réessayer." });
        setCvFile(null);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        Swal.fire({ icon: "error", title: "Timeout", text: "L'upload a expiré. Vérifiez votre connexion." });
      } else {
        Swal.fire({ icon: "error", title: "Erreur réseau", text: "Impossible de contacter le serveur." });
      }
      setCvFile(null);
    }

    setLoading(false);
  }, [setCvFile, setCvToken, onCvData]);

  const handleChange = () => { setCvFile(null); setCvToken(""); };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  return (
    <div className="ins-step-content">
      {!cvFile ? (
        <div
          className={`ins-dropzone${dragging ? " dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          role="button" tabIndex={0} aria-label="Zone de dépôt de fichier CV"
          onKeyDown={(e) => e.key === "Enter" && inputRef.current.click()}
        >
          <input ref={inputRef} type="file" style={{ display: "none" }} accept=".pdf,.doc,.docx"
            onChange={(e) => handleFile(e.target.files[0])} tabIndex={-1} aria-hidden="true" />
          <i className="fas fa-cloud-upload-alt ins-dropzone__icon" aria-hidden="true" />
          <p className="ins-dropzone__text">Glissez votre CV ici</p>
          <p className="ins-dropzone__sub">ou cliquez pour sélectionner</p>
          <p className="ins-dropzone__formats">PDF · DOC · DOCX — Max 10 Mo</p>
        </div>
      ) : loading ? (
        <div className="ins-loading" role="status" aria-live="polite">
          <div className="ins-spinner" aria-hidden="true" />
          <p>Analyse du CV en cours…</p>
          <small>Extraction automatique des informations</small>
        </div>
      ) : (
        <div className="ins-cv-ready" role="status" aria-live="polite">
          <div className="ins-cv-ready__icon" aria-hidden="true"><i className="fas fa-check-circle" /></div>
          <p className="ins-cv-ready__name">{sanitizeText(cvFile.name)}</p>
          <p className="ins-cv-ready__info">CV analysé avec succès</p>
          <div className="ins-cv-ready__actions">
            <button className="ins-btn ins-btn--ghost" onClick={handleChange}>
              <i className="fas fa-redo" aria-hidden="true" /> Changer
            </button>
            <button className="ins-btn ins-btn--primary" onClick={onNext}>
              Continuer <i className="fas fa-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 1 — Informations personnelles ──────────────────────────────────────
function StepPersonal({ form, setForm, onNext, onBack }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const errs = {};
    const required = ["nom", "prenoms", "email", "tel", "genre", "date_naissance"];
    for (const k of required) {
      if (!form[k] || !form[k].toString().trim()) errs[k] = "Ce champ est obligatoire.";
    }
    if (form.email       && !isValidEmail(form.email))       errs.email        = "Adresse email invalide.";
    if (form.tel         && !isValidPhone(form.tel))         errs.tel          = "Numéro invalide.";
    if (form.tel_whatsapp && !isValidPhone(form.tel_whatsapp)) errs.tel_whatsapp = "Numéro WhatsApp invalide.";
    if (form.date_naissance) {
      const dob = new Date(form.date_naissance);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (isNaN(dob.getTime()) || dob >= new Date()) errs.date_naissance = "Date invalide.";
      else if (age < 16) errs.date_naissance = "Vous devez avoir au moins 16 ans.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const canSubmit = () => {
    const required = ["nom", "prenoms", "email", "tel", "genre", "date_naissance"];
    return required.every((k) => form[k] && form[k].toString().trim());
  };

  return (
    <div className="ins-step-content">
      <div className="ins-step-header"><h3>Informations personnelles</h3></div>
      <div className="ins-grid-2">
        <Field label="Nom" required htmlFor="sp-nom">
          <Input id="sp-nom" value={form.nom} onChange={set("nom")} placeholder="Votre nom" maxLength={100} autoComplete="family-name" />
          {fieldErrors.nom && <span className="ins-field-error" role="alert">{fieldErrors.nom}</span>}
        </Field>
        <Field label="Prénom(s)" required htmlFor="sp-prenoms">
          <Input id="sp-prenoms" value={form.prenoms} onChange={set("prenoms")} placeholder="Vos prénoms" maxLength={100} autoComplete="given-name" />
          {fieldErrors.prenoms && <span className="ins-field-error" role="alert">{fieldErrors.prenoms}</span>}
        </Field>
        <Field label="Email" required htmlFor="sp-email">
          <Input id="sp-email" type="email" value={form.email} onChange={set("email")} placeholder="email@exemple.com" maxLength={254} autoComplete="email" />
          {fieldErrors.email && <span className="ins-field-error" role="alert">{fieldErrors.email}</span>}
        </Field>
        <Field label="Téléphone" required htmlFor="sp-tel">
          <Input id="sp-tel" type="tel" value={form.tel} onChange={set("tel")} placeholder="+225 07 00 00 00 00" maxLength={20} autoComplete="tel" />
          {fieldErrors.tel && <span className="ins-field-error" role="alert">{fieldErrors.tel}</span>}
        </Field>
        <Field label="WhatsApp" htmlFor="sp-telwhat" hint="Facultatif — si différent du principal">
          <Input id="sp-telwhat" type="tel" value={form.tel_whatsapp} onChange={set("tel_whatsapp")} placeholder="+225 07 00 00 00 00" maxLength={20} />
          {fieldErrors.tel_whatsapp && <span className="ins-field-error" role="alert">{fieldErrors.tel_whatsapp}</span>}
        </Field>
        <Field label="Genre" required htmlFor="sp-genre">
          <Select id="sp-genre" value={form.genre} onChange={set("genre")}
            options={[{ value: "homme", label: "Homme" }, { value: "femme", label: "Femme" }]} />
          {fieldErrors.genre && <span className="ins-field-error" role="alert">{fieldErrors.genre}</span>}
        </Field>
        <Field label="Date de naissance" required htmlFor="sp-dob">
          <Input id="sp-dob" type="date" value={form.date_naissance} onChange={set("date_naissance")}
            max={new Date().toISOString().split("T")[0]} />
          {fieldErrors.date_naissance && <span className="ins-field-error" role="alert">{fieldErrors.date_naissance}</span>}
        </Field>
        <Field label="Commune / Ville" htmlFor="sp-commune">
          <Select id="sp-commune" value={form.commune} onChange={set("commune")} options={COMMUNES} placeholder="Sélectionner" />
        </Field>
        <Field label="Quartier" htmlFor="sp-quartier">
          <Input id="sp-quartier" value={form.quartier} onChange={set("quartier")} placeholder="Ex : Cocody Riviera" maxLength={100} />
        </Field>
      </div>
      <div className="ins-nav-btns">
        <button className="ins-btn ins-btn--ghost" onClick={onBack}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> Retour
        </button>
        <button className="ins-btn ins-btn--primary" onClick={() => validate() && onNext()} disabled={!canSubmit()}>
          Suivant <i className="fas fa-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2 — Profil professionnel ───────────────────────────────────────────
function StepPro({ form, setForm, onNext, onBack }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const validate = () => form.secteur_activite && form.niveau_academique && form.niveau_anglais;

  return (
    <div className="ins-step-content">
      <div className="ins-step-header"><h3>Profil professionnel</h3></div>
      <div className="ins-grid-2">
        <Field label="Secteur d'activité" required htmlFor="sp-secteur">
          <Select id="sp-secteur" value={form.secteur_activite} onChange={set("secteur_activite")} options={SECTEURS} placeholder="Sélectionner le secteur" />
        </Field>
        <Field label="Niveau académique" required htmlFor="sp-niveau">
          <Select id="sp-niveau" value={form.niveau_academique} onChange={set("niveau_academique")} options={NIVEAUX} placeholder="Sélectionner le niveau" />
        </Field>
        <Field label="Niveau d'anglais" required htmlFor="sp-anglais">
          <Select id="sp-anglais" value={form.niveau_anglais} onChange={set("niveau_anglais")}
            options={[
              { value: "faible",   label: "Faible" },
              { value: "moyen",    label: "Moyen" },
              { value: "courant",  label: "Courant" },
              { value: "bilingue", label: "Bilingue" },
            ]} />
        </Field>
      </div>
      <div className="ins-nav-btns">
        <button className="ins-btn ins-btn--ghost" onClick={onBack}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> Retour
        </button>
        <button className="ins-btn ins-btn--primary" onClick={() => validate() && onNext()} disabled={!validate()}>
          Suivant <i className="fas fa-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 — Documents + soumission finale ───────────────────────────────────
function StepDocuments({ form, setForm, onSubmit, onBack, submitting }) {
  const [fileErrors, setFileErrors] = useState({ Lettre_M: "", Fichier_diplome: "" });

  const handleFileChange = (fieldKey, allowedExts) => (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const v = validateFile(file, allowedExts);
    if (!v.ok) {
      Swal.fire({ icon: "error", title: "Fichier invalide", text: v.error });
      setFileErrors((p) => ({ ...p, [fieldKey]: v.error }));
      setForm((f) => ({ ...f, [fieldKey]: null }));
      return;
    }
    setFileErrors((p) => ({ ...p, [fieldKey]: "" }));
    setForm((f) => ({ ...f, [fieldKey]: file }));
  };

  return (
    <div className="ins-step-content">
      <div className="ins-step-header">
        <h3>Documents complémentaires</h3>
        <p>Ces documents sont facultatifs mais recommandés</p>
      </div>
      <div className="ins-grid-2">
        <Field label="Lettre de motivation" hint="PDF, DOC, DOCX — Max 10 Mo" htmlFor="sp-lettre">
          <label className="ins-file-label" htmlFor="sp-lettre">
            <i className="fas fa-envelope-open-text" aria-hidden="true" />
            <span>{form.Lettre_M ? sanitizeText(form.Lettre_M.name) : "Choisir un fichier"}</span>
            <input id="sp-lettre" type="file" style={{ display: "none" }} accept=".pdf,.doc,.docx"
              onChange={handleFileChange("Lettre_M", LETTRE_EXTS)} />
          </label>
          {fileErrors.Lettre_M && <span className="ins-field-error" role="alert">{fileErrors.Lettre_M}</span>}
          {form.Lettre_M && !fileErrors.Lettre_M && <span className="ins-field-ok" role="status"><i className="fas fa-check-circle" aria-hidden="true" /> Fichier valide</span>}
        </Field>
        <Field label="Diplôme" hint="PDF, DOC, DOCX, JPG, PNG — Max 10 Mo" htmlFor="sp-diplome">
          <label className="ins-file-label" htmlFor="sp-diplome">
            <i className="fas fa-graduation-cap" aria-hidden="true" />
            <span>{form.Fichier_diplome ? sanitizeText(form.Fichier_diplome.name) : "Choisir un fichier"}</span>
            <input id="sp-diplome" type="file" style={{ display: "none" }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange("Fichier_diplome", DIPLOME_EXTS)} />
          </label>
          {fileErrors.Fichier_diplome && <span className="ins-field-error" role="alert">{fileErrors.Fichier_diplome}</span>}
          {form.Fichier_diplome && !fileErrors.Fichier_diplome && <span className="ins-field-ok" role="status"><i className="fas fa-check-circle" aria-hidden="true" /> Fichier valide</span>}
        </Field>
      </div>
      <div className="ins-nav-btns">
        <button className="ins-btn ins-btn--ghost" onClick={onBack} disabled={submitting}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> Retour
        </button>
        <button className="ins-btn ins-btn--submit" onClick={onSubmit} disabled={submitting} aria-busy={submitting}>
          {submitting
            ? <><div className="ins-spinner ins-spinner--sm" aria-hidden="true" /> Envoi…</>
            : <>Envoyer ma candidature</>}
        </button>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ onReset }) {
  return (
    <div className="ins-success" role="status" aria-live="polite">
      <div className="ins-success__circle" aria-hidden="true"><i className="fas fa-check" /></div>
      <h3>Candidature envoyée !</h3>
      <p>Votre candidature spontanée a bien été reçue. Nous vous contacterons si votre profil correspond à nos besoins.</p>
      <button className="ins-btn ins-btn--primary ins-btn--lg" onClick={onReset}>
        <i className="fas fa-redo" aria-hidden="true" /> Nouvelle candidature
      </button>
    </div>
  );
}

// ─── État initial ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  nom: "", prenoms: "", email: "", tel: "", tel_whatsapp: "",
  genre: "", date_naissance: "", commune: "", quartier: "",
  secteur_activite: "", niveau_academique: "", niveau_anglais: "",
  Lettre_M: null, Fichier_diplome: null,
};

// ─── Composant racine ─────────────────────────────────────────────────────────
export default function InscriptionSpontanee() {
  const [step,       setStep]       = useState(0);
  const [cvFile,     setCvFile]     = useState(null);
  const [cvToken,    setCvToken]    = useState("");
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  // Chargement initial du token CSRF
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const handleCvData = useCallback((data) => {
    if (!data) return;
    setForm((f) => ({
      ...f,
      nom:               data.nom               || f.nom,
      prenoms:           data.prenoms            || f.prenoms,
      email:             data.email              || f.email,
      tel:               data.tel                || f.tel,
      genre:             mapGenre(data.genre)    || f.genre,
      date_naissance:    data.date_naissance     || f.date_naissance,
      commune:           data.commune            || f.commune,
      quartier:          data.quartier           || f.quartier,
      secteur_activite:  data.secteur_activite   || f.secteur_activite,
      niveau_academique: data.niveau_academique  || f.niveau_academique,
      niveau_anglais:    data.niveau_anglais     || f.niveau_anglais,
    }));
  }, []);

  const next = () => { window.scrollTo({ top: 0, behavior: "smooth" }); setStep((s) => s + 1); };
  const back = () => { window.scrollTo({ top: 0, behavior: "smooth" }); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    // Rate limit client
    if (isRateLimited()) {
      const h = getTimeUntilUnlock();
      Swal.fire({ icon: "error", title: "Trop de tentatives", text: `Limite atteinte. Réessayez dans ${h ?? 24}h.`, confirmButtonColor: "#d33" });
      return;
    }

    if (!cvToken) {
      Swal.fire({ icon: "error", title: "CV manquant", text: "Veuillez recommencer depuis l'étape CV." });
      return;
    }

    setSubmitting(true);

    // Recharger le CSRF si absent
    if (!_csrfToken) {
      await fetchCsrfToken();
      if (!_csrfToken) {
        Swal.fire({ icon: "error", title: "Erreur de session", text: "Impossible d'obtenir un token de sécurité. Rechargez la page." });
        setSubmitting(false);
        return;
      }
    }

    try {
      const fd = new FormData();
      fd.append("action",    "submit_form");
      fd.append("cv_token",  cvToken);
      fd.append("csrf_token", _csrfToken ?? "");

      const textFields = [
        "nom","prenoms","email","tel","tel_whatsapp",
        "date_naissance","genre","secteur_activite",
        "niveau_academique","niveau_anglais","commune","quartier",
      ];
      textFields.forEach((key) => { fd.append(key, form[key] ?? ""); });
      if (form.Lettre_M)       fd.append("Lettre_M",       form.Lettre_M);
      if (form.Fichier_diplome) fd.append("Fichier_diplome", form.Fichier_diplome);

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 30000);

      let res;
      try {
        res = await fetch(API_URL, {
          method:      "POST",
          credentials: "include",
          headers:     { Accept: "application/json", "X-CSRF-Token": _csrfToken ?? "" },
          body:        fd,
          signal:      controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Rotation CSRF
      refreshCsrfFromResponse(res);

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const raw = await res.text();
        console.error("[SUBMIT] Réponse non-JSON:", raw.slice(0, 500));
        Swal.fire({ icon: "error", title: "Erreur serveur", text: "Le serveur a retourné une réponse inattendue." });
        setSubmitting(false);
        return;
      }

      const data = await res.json();

      if (res.status === 403) {
        await fetchCsrfToken();
        Swal.fire({ icon: "warning", title: "Session expirée", text: data.message || "Veuillez réessayer." });
        setSubmitting(false);
        return;
      }

      if (res.status === 429) {
        const msg = data.errors?.[0] || (typeof data.errors === "object" && !Array.isArray(data.errors) && Object.values(data.errors)[0]) || "Trop de tentatives. Réessayez plus tard.";
        recordFailedAttempt();
        Swal.fire({ icon: "error", title: "Trop de tentatives", text: msg, confirmButtonColor: "#d33" });
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        recordFailedAttempt();
        let errorMsg = "Erreur lors de l'envoi.";
        if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors))
          errorMsg = Object.values(data.errors).flat().join(", ");
        else if (Array.isArray(data.errors)) errorMsg = data.errors.join(", ");
        else if (data.message) errorMsg = data.message;
        Swal.fire({ icon: "error", title: "Envoi échoué", text: errorMsg });
        setSubmitting(false);
        return;
      }

      if (data.success) {
        resetRateLimit();
        setDone(true);
      } else {
        recordFailedAttempt();
        Swal.fire({ icon: "error", title: "Erreur", text: (Array.isArray(data.errors) ? data.errors.join(", ") : null) || data.message || "Une erreur inconnue est survenue." });
      }
    } catch (err) {
      if (err.name === "AbortError") {
        Swal.fire({ icon: "error", title: "Timeout", text: "La requête a expiré. Vérifiez votre connexion." });
      } else {
        Swal.fire({ icon: "error", title: "Erreur réseau", text: err.message || "Impossible de contacter le serveur." });
      }
    }

    setSubmitting(false);
  };

  const reset = () => {
    setStep(0);
    setCvFile(null);
    setCvToken("");
    setForm(EMPTY_FORM);
    setDone(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Regénérer un token CSRF propre après reset
    fetchCsrfToken();
  };

  return (
    <div className="ins-page">
      <header className="ins-topbar">
        <Link to="/" className="ins-topbar__back" aria-label="Retour à l'accueil">
          <i className="fas fa-arrow-left" aria-hidden="true" /> Accueil
        </Link>
        <img src={zenImg} alt="Zenselekt — retour à l'accueil" className="ins-topbar__logo" />
      </header>

      <main className="ins-wrapper">
        <div className="ins-card" role="main">
          <div className="ins-card__header">
            <h1>Candidature spontanée</h1>
            <p className="ins-card__subtitle" style={{ color: "#fff" }}>
              Rejoignez notre vivier de talents — nous vous contacterons lors d'une opportunité correspondant à votre profil.
            </p>
          </div>

          {done ? (
            <SuccessScreen onReset={reset} />
          ) : (
            <>
              <StepBar current={step} />

              {step === 0 && (
                <StepCV onNext={next} cvFile={cvFile} setCvFile={setCvFile}
                  setCvToken={setCvToken} onCvData={handleCvData} />
              )}
              {step === 1 && <StepPersonal form={form} setForm={setForm} onNext={next} onBack={back} />}
              {step === 2 && <StepPro      form={form} setForm={setForm} onNext={next} onBack={back} />}
              {step === 3 && (
                <StepDocuments form={form} setForm={setForm}
                  onSubmit={handleSubmit} onBack={back} submitting={submitting} />
              )}

              <div className="ins-reset">
                <button className="ins-reset__btn" onClick={reset} aria-label="Recommencer la candidature">
                  <i className="fas fa-redo" aria-hidden="true" /> Recommencer
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}