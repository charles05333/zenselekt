import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Swal from 'sweetalert2';
import "./css/Inscription.css";
import zenImg from "../assets/img/zen.png";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/backoffice';

const PAYS = [
  "Afghanistan","Afrique du Sud","Albanie","Algérie","Allemagne","Angola","Arabie Saoudite",
  "Argentine","Australie","Autriche","Azerbaïdjan","Bahreïn","Bangladesh","Belgique","Bénin",
  "Bolivie","Bosnie-Herzégovine","Botswana","Brésil","Bulgarie","Burkina Faso","Burundi",
  "Cambodge","Cameroun","Canada","Cap-Vert","Chili","Chine","Chypre","Colombie","Comores",
  "Congo","Corée du Sud","Costa Rica","Côte d'Ivoire","Croatie","Cuba","Danemark","Djibouti",
  "Égypte","Émirats Arabes Unis","Équateur","Érythrée","Espagne","Estonie","Éthiopie",
  "Finlande","France","Gabon","Gambie","Ghana","Grèce","Guatemala","Guinée","Guinée-Bissau",
  "Guinée Équatoriale","Haïti","Honduras","Hongrie","Inde","Indonésie","Irak","Iran","Irlande",
  "Islande","Israël","Italie","Jamaïque","Japon","Jordanie","Kazakhstan","Kenya","Koweït",
  "Laos","Lesotho","Lettonie","Liban","Libéria","Libye","Lituanie","Luxembourg","Macédoine",
  "Madagascar","Malawi","Mali","Malte","Maroc","Mauritanie","Mexique","Moldavie","Mongolie",
  "Mozambique","Namibie","Népal","Nicaragua","Niger","Nigéria","Norvège","Nouvelle-Zélande",
  "Oman","Ouganda","Pakistan","Palestine","Panama","Paraguay","Pays-Bas","Pérou","Philippines",
  "Pologne","Portugal","Qatar","République Centrafricaine","République Dominicaine",
  "République Tchèque","Roumanie","Royaume-Uni","Russie","Rwanda","Sénégal","Serbie",
  "Sierra Leone","Singapour","Slovaquie","Slovénie","Somalie","Soudan","Soudan du Sud",
  "Sri Lanka","Suède","Suisse","Syrie","Tanzanie","Tchad","Thaïlande","Togo","Tunisie",
  "Turkménistan","Turquie","Ukraine","Uruguay","Venezuela","Viêt Nam","Yémen","Zambie","Zimbabwe"
];

const SECTEURS = [
  "Agriculture / Élevage / Pêche", "Agroalimentaire", "Architecture / Urbanisme / Design",
  "Art / Culture / Spectacle", "Artisanat / Métiers manuels", "Audit / Expertise comptable",
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
  "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", "Plateau",
  "Port-Bouët", "Treichville", "Yopougon", "Aboisso", "Adzopé", "Agboville",
  "Bouaké", "Bondoukou", "Dabou", "Daloa", "Daoukro", "Dimbokro", "Divo",
  "Ferkessédougou", "Gagnoa", "Grand-Bassam", "Guiglo", "Issia", "Jacqueville",
  "Katiola", "Korhogo", "Man", "Minignan", "Odienné", "San-Pédro", "Sassandra",
  "Séguéla", "Soubré", "Tabou", "Toumodi", "Yamoussoukro",
  "Autres / Hors Côte d'Ivoire",
];

const STEPS = ["CV", "Informations", "Professionnel", "Documents", "Sécurité"];

// ─── Rate limit côté client — 3 tentatives max ────────────────────────────────
const MAX_FILE_SIZE    = 20 * 1024 * 1024;
const RATE_LIMIT_KEY   = "inscription_rate_limit";
const MAX_ATTEMPTS     = 3;                      // ← 3 tentatives
const LOCKOUT_DURATION = 24 * 60 * 60 * 1000;   // 24 h

function getRateLimitData() {
  try {
    const data = localStorage.getItem(RATE_LIMIT_KEY);
    return data ? JSON.parse(data) : { attempts: 0, blockedUntil: null };
  } catch {
    return { attempts: 0, blockedUntil: null };
  }
}

function setRateLimitData(attempts, blockedUntil) {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ attempts, blockedUntil }));
  } catch {
    console.warn("Impossible d'accéder à localStorage");
  }
}

function isRateLimited() {
  const { blockedUntil } = getRateLimitData();
  if (!blockedUntil) return false;
  const now = Date.now();
  if (now < blockedUntil) return true;
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
  if (attempts >= MAX_ATTEMPTS) {
    blockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  setRateLimitData(attempts, blockedUntil);
}

function resetRateLimit() {
  setRateLimitData(0, null);
}

// ─── CSRF helpers ─────────────────────────────────────────────────────────────

/**
 * Récupère un token CSRF depuis le serveur.
 * Stocke le token en mémoire (variable module), jamais en localStorage.
 */
let _csrfToken = null;

async function fetchCsrfToken() {
  try {
    const res = await fetch(`${API_BASE}/csrf-token`, {
      method:      "GET",
      credentials: "include",        // envoie le cookie de session
      headers:     { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error("Échec récupération CSRF");
    const data = await res.json();
    _csrfToken = data.csrf_token ?? null;
  } catch (err) {
    console.error("[CSRF] fetchCsrfToken:", err);
    _csrfToken = null;
  }
}

/**
 * Met à jour le token CSRF local à partir du header X-CSRF-Token-New
 * retourné par le serveur après chaque requête POST (rotation).
 */
function refreshCsrfFromResponse(response) {
  const newToken = response.headers.get("X-CSRF-Token-New");
  if (newToken) _csrfToken = newToken;
}

/**
 * Ajoute le header CSRF à un objet Headers ou le retourne directement.
 */
function csrfHeaders(extra = {}) {
  return {
    "Accept":       "application/json",
    "X-CSRF-Token": _csrfToken ?? "",
    ...extra,
  };
}

// ─── Validation helpers ───────────────────────────────────────────────────────
function sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 && /^[+\d\s\-().]+$/.test(phone);
}

function validateFile(file, allowedExts, allowedMimes) {
  if (!file) return { ok: false, error: "Aucun fichier sélectionné." };
  const ext = file.name.split(".").pop().toLowerCase();
  if (!allowedExts.includes(ext))
    return { ok: false, error: `Extension non autorisée. Formats acceptés : ${allowedExts.join(", ").toUpperCase()}.` };
  if (allowedMimes && !allowedMimes.includes(file.type))
    return { ok: false, error: "Type de fichier invalide (MIME non autorisé)." };
  if (file.size > MAX_FILE_SIZE)
    return { ok: false, error: "Le fichier ne doit pas dépasser 20 Mo." };
  if (file.size === 0)
    return { ok: false, error: "Le fichier est vide." };
  return { ok: true };
}

const CV_EXTS  = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const CV_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
const DIPLOME_EXTS  = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const DIPLOME_MIMES = CV_MIMES;
const LETTRE_EXTS   = ["pdf", "doc", "docx"];
const LETTRE_MIMES  = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
          aria-label={`Étape ${i + 1} : ${label}${i < current ? " (complétée)" : i === current ? " (en cours)" : ""}`}
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

// ─── Field components ─────────────────────────────────────────────────────────
function Field({ label, required, children, hint, htmlFor }) {
  return (
    <div className="ins-field">
      <label className="ins-label" htmlFor={htmlFor}>
        {label} {required && <span className="ins-required" aria-label="champ obligatoire">*</span>}
      </label>
      {children}
      {hint && <small className="ins-hint" role="note">{hint}</small>}
    </div>
  );
}

function Input({ id, value, onChange, type = "text", placeholder, min, max, required, maxLength = 255, autoComplete }) {
  return (
    <input
      id={id}
      className="ins-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
      placeholder={placeholder}
      min={min}
      max={max}
      required={required}
      maxLength={maxLength}
      autoComplete={autoComplete || "off"}
      spellCheck={false}
    />
  );
}

function Select({ id, value, onChange, options, placeholder = "Sélectionner", required }) {
  return (
    <select
      id={id}
      className="ins-input ins-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) =>
        typeof opt === "string"
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
  );
}

// ─── Step 0 — CV Upload ────────────────────────────────────────────────────────
function StepCV({ onNext, cvData, setCvData, cvFile, setCvFile, setCvToken }) {
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const validation = validateFile(file, CV_EXTS, CV_MIMES);
    if (!validation.ok) {
      Swal.fire({ icon: 'error', title: 'Fichier invalide', text: validation.error });
      return;
    }

    setCvFile(file);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("Fichier_cv", file);
      // Le token CSRF est envoyé dans le header (pas dans le body pour multipart)
      fd.append("csrf_token", _csrfToken ?? "");

      const res = await fetch(`${API_BASE}/inscription/upload-cv`, {
        method:      "POST",
        credentials: "include",
        headers:     { "X-CSRF-Token": _csrfToken ?? "" },
        body:        fd,
      });

      // Rotation du token CSRF
      refreshCsrfFromResponse(res);

      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({ icon: 'error', title: 'Session expirée', text: errData.message || "Rechargez la page." });
        // Regénérer un token CSRF propre
        await fetchCsrfToken();
        setCvFile(null);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.errors?.[0] || errData.message || "Erreur lors de l'upload.";
        Swal.fire({ icon: 'error', title: 'Upload échoué', text: msg });
        setCvFile(null);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.extraction_failed) {
        Swal.fire({ icon: 'error', title: 'Lecture impossible', text: 'Essayez de convertir votre CV en PDF.' });
        setCvFile(null);
        setLoading(false);
        return;
      }

      if (!data.is_valid_cv) {
        Swal.fire({ icon: 'error', title: 'CV invalide', text: data.errors?.[0] || "Ce document ne ressemble pas à un CV valide." });
        setCvFile(null);
        setLoading(false);
        return;
      }

      if (data.success) {
        setCvToken(data.cv_token);
        setCvData(data.data);
        Swal.fire({
          icon: 'success',
          title: 'CV analysé',
          text: 'Les informations ont été extraites automatiquement.',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Erreur analyse', text: data.errors?.[0] || "Veuillez réessayer." });
        setCvFile(null);
      }

    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Erreur réseau', text: 'Impossible de contacter le serveur.' });
      setCvFile(null);
    }

    setLoading(false);
  }, [setCvFile, setCvData, setCvToken]);

  const handleChange = () => {
    setCvFile(null);
    setCvData({});
    setCvToken("");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="ins-step-content">
      {!cvFile ? (
        <div
          className={`ins-dropzone${dragging ? " dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          role="button"
          tabIndex={0}
          aria-label="Zone de dépôt de fichier CV"
          onKeyDown={(e) => e.key === "Enter" && inputRef.current.click()}
        >
          <input
            ref={inputRef}
            type="file"
            style={{ display: "none" }}
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleFile(e.target.files[0])}
            tabIndex={-1}
            aria-hidden="true"
          />
          <i className="fas fa-cloud-upload-alt ins-dropzone__icon" aria-hidden="true" />
          <p className="ins-dropzone__text">Glissez votre CV ici</p>
          <p className="ins-dropzone__sub">ou cliquez pour sélectionner</p>
          <p className="ins-dropzone__formats">PDF · DOC · DOCX — Max 20 Mo</p>
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

// ─── Step 1 — Personal info ───────────────────────────────────────────────────
function StepPersonal({ form, setForm, onNext, onBack }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const errs = {};
    const required = ["nom","prenoms","email","tel","Genre","date_N","Pays_N","Pays_R","Situation_M"];
    for (const k of required) {
      if (!form[k] || !form[k].toString().trim()) errs[k] = "Ce champ est obligatoire.";
    }
    if (form.email   && !isValidEmail(form.email))   errs.email   = "Adresse email invalide.";
    if (form.tel     && !isValidPhone(form.tel))     errs.tel     = "Numéro de téléphone invalide.";
    if (form.telwhat && !isValidPhone(form.telwhat)) errs.telwhat = "Numéro WhatsApp invalide.";
    if (form.date_N) {
      const dob = new Date(form.date_N);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (isNaN(dob.getTime()) || dob >= today) errs.date_N = "Date de naissance invalide.";
      else if (age < 16) errs.date_N = "Vous devez avoir au moins 16 ans.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validate()) onNext(); };

  const canSubmit = () => {
    const required = ["nom","prenoms","email","tel","Genre","date_N","Pays_N","Pays_R","Situation_M"];
    return required.every(k => form[k] && form[k].toString().trim());
  };

  return (
    <div className="ins-step-content">
      <div className="ins-step-header"><h3>Informations personnelles</h3></div>

      <div className="ins-grid-2">
        <Field label="Nom" required htmlFor="f-nom">
          <Input id="f-nom" value={form.nom} onChange={set("nom")} placeholder="Votre nom" maxLength={100} autoComplete="family-name" />
          {fieldErrors.nom && <span className="ins-field-error" role="alert">{fieldErrors.nom}</span>}
        </Field>

        <Field label="Prénom(s)" required htmlFor="f-prenoms">
          <Input id="f-prenoms" value={form.prenoms} onChange={set("prenoms")} placeholder="Vos prénoms" maxLength={100} autoComplete="given-name" />
          {fieldErrors.prenoms && <span className="ins-field-error" role="alert">{fieldErrors.prenoms}</span>}
        </Field>

        <Field label="Email" required htmlFor="f-email">
          <Input id="f-email" type="email" value={form.email} onChange={set("email")} placeholder="email@exemple.com" maxLength={254} autoComplete="email" />
          {fieldErrors.email && <span className="ins-field-error" role="alert">{fieldErrors.email}</span>}
        </Field>

        <Field label="Téléphone" required htmlFor="f-tel">
          <Input id="f-tel" type="tel" value={form.tel} onChange={set("tel")} placeholder="+225 07 00 00 00 00" maxLength={20} autoComplete="tel" />
          {fieldErrors.tel && <span className="ins-field-error" role="alert">{fieldErrors.tel}</span>}
        </Field>

        <Field label="WhatsApp" htmlFor="f-telwhat" hint="Facultatif — si différent du numéro principal">
          <Input id="f-telwhat" type="tel" value={form.telwhat} onChange={set("telwhat")} placeholder="+225 07 00 00 00 00" maxLength={20} />
          {fieldErrors.telwhat && <span className="ins-field-error" role="alert">{fieldErrors.telwhat}</span>}
        </Field>

        <Field label="Genre" required htmlFor="f-genre">
          <Select id="f-genre" value={form.Genre} onChange={set("Genre")}
            options={[{value:"Homme",label:"Homme"},{value:"Femme",label:"Femme"}]} />
          {fieldErrors.Genre && <span className="ins-field-error" role="alert">{fieldErrors.Genre}</span>}
        </Field>

        <Field label="Date de naissance" required htmlFor="f-dob">
          <Input id="f-dob" type="date" value={form.date_N} onChange={set("date_N")} max={new Date().toISOString().split("T")[0]} />
          {fieldErrors.date_N && <span className="ins-field-error" role="alert">{fieldErrors.date_N}</span>}
        </Field>

        <Field label="Lieu de naissance" htmlFor="f-lieu">
          <Input id="f-lieu" value={form.Lieu_N} onChange={set("Lieu_N")} placeholder="Ville de naissance" maxLength={100} />
        </Field>

        <Field label="Pays de naissance" required htmlFor="f-pays-n">
          <Select id="f-pays-n" value={form.Pays_N} onChange={set("Pays_N")} options={PAYS} />
          {fieldErrors.Pays_N && <span className="ins-field-error" role="alert">{fieldErrors.Pays_N}</span>}
        </Field>

        <Field label="Pays de résidence" required htmlFor="f-pays-r">
          <Select id="f-pays-r" value={form.Pays_R} onChange={set("Pays_R")} options={PAYS} />
          {fieldErrors.Pays_R && <span className="ins-field-error" role="alert">{fieldErrors.Pays_R}</span>}
        </Field>

        <Field label="Situation matrimoniale" required htmlFor="f-situation">
          <Select id="f-situation" value={form.Situation_M} onChange={set("Situation_M")}
            options={["Célibataire","Marié(e)","Pacsé(e)","Veuf(ve)","Divorcé(e)"]} />
          {fieldErrors.Situation_M && <span className="ins-field-error" role="alert">{fieldErrors.Situation_M}</span>}
        </Field>

        <Field label="Nombre d'enfants" htmlFor="f-enfants">
          <Input id="f-enfants" type="number" value={form.Nombre_E} onChange={set("Nombre_E")} min={0} max={20} placeholder="0" />
        </Field>

        <Field label="Commune / Ville" htmlFor="f-commune">
          <Select id="f-commune" value={form.Commune} onChange={set("Commune")} options={COMMUNES} placeholder="Sélectionner la commune" />
        </Field>

        <Field label="Quartier" htmlFor="f-quartier">
          <Input id="f-quartier" value={form.Quartier} onChange={set("Quartier")} placeholder="Ex: Cocody" maxLength={100} />
        </Field>
      </div>

      <div className="ins-nav-btns">
        <button className="ins-btn ins-btn--ghost" onClick={onBack}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> Retour
        </button>
        <button className="ins-btn ins-btn--primary" onClick={handleNext} disabled={!canSubmit()}>
          Suivant <i className="fas fa-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2 — Professional ────────────────────────────────────────────────────
function StepPro({ form, setForm, onNext, onBack }) {
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const validate = () => form.Secteur && form.Niveau && form.Niveau_A;

  return (
    <div className="ins-step-content">
      <div className="ins-step-header"><h3>Profil professionnel</h3></div>

      <div className="ins-grid-2">
        <Field label="Secteur d'activité" required htmlFor="f-secteur">
          <Select id="f-secteur" value={form.Secteur} onChange={set("Secteur")} options={SECTEURS} placeholder="Sélectionner le secteur" />
        </Field>

        <Field label="Niveau académique" required htmlFor="f-niveau">
          <Select id="f-niveau" value={form.Niveau} onChange={set("Niveau")} options={NIVEAUX} placeholder="Sélectionner le niveau" />
        </Field>

        <Field label="Niveau d'anglais" required htmlFor="f-anglais">
          <Select id="f-anglais" value={form.Niveau_A} onChange={set("Niveau_A")}
            options={[
              {value:"faible",   label:"Faible"},
              {value:"moyen",    label:"Moyen"},
              {value:"courant",  label:"Courant"},
              {value:"bilingue", label:"Bilingue"},
            ]} />
        </Field>
      </div>

      <div className="ins-section-divider" aria-hidden="true" />

      <div className="ins-grid-2 ins-grid-2--full">
        <Field label="Références professionnelles (min. 3)" hint="Nom, Fonction, Contact" htmlFor="f-ref-pro">
          <textarea
            id="f-ref-pro" className="ins-input ins-textarea" rows={5}
            value={form.Ref_P}
            onChange={(e) => set("Ref_P")(e.target.value.slice(0, 2000))}
            placeholder="Ex: M. Kouadio, DRH Chez ABC, +225 07 00 00 00"
            maxLength={2000} spellCheck={false}
          />
        </Field>
        <Field label="Références académiques (min. 3)" hint="Nom, Institution, Contact" htmlFor="f-ref-aca">
          <textarea
            id="f-ref-aca" className="ins-input ins-textarea" rows={5}
            value={form.Ref_A}
            onChange={(e) => set("Ref_A")(e.target.value.slice(0, 2000))}
            placeholder="Ex: Dr. Traoré, Université HEC, +225 07 00 00 00"
            maxLength={2000} spellCheck={false}
          />
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

// ─── Step 3 — Documents ───────────────────────────────────────────────────────
function StepDocuments({ form, setForm, onNext, onBack }) {
  const [fileErrors, setFileErrors] = useState({ Fichiers_D: "", Lettre_M: "" });

  const handleFileChange = (fieldKey, allowedExts, allowedMimes) => (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const validation = validateFile(file, allowedExts, allowedMimes);
    if (!validation.ok) {
      Swal.fire({ icon: 'error', title: 'Fichier invalide', text: validation.error });
      setFileErrors(prev => ({ ...prev, [fieldKey]: validation.error }));
      setForm(f => ({ ...f, [fieldKey]: null }));
      return;
    }
    setFileErrors(prev => ({ ...prev, [fieldKey]: "" }));
    setForm(f => ({ ...f, [fieldKey]: file }));
  };

  return (
    <div className="ins-step-content">
      <div className="ins-step-header">
        <h3>Documents complémentaires</h3>
        <p>Ces documents sont facultatifs mais recommandés</p>
      </div>

      <div className="ins-grid-2">
        <Field label="Diplôme" hint="PDF, DOC, DOCX, JPG, PNG — Max 20 Mo" htmlFor="f-diplome">
          <label className="ins-file-label" htmlFor="f-diplome">
            <i className="fas fa-graduation-cap" aria-hidden="true" />
            <span>{form.Fichiers_D ? sanitizeText(form.Fichiers_D.name) : "Choisir un fichier"}</span>
            <input id="f-diplome" type="file" style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange("Fichiers_D", DIPLOME_EXTS, DIPLOME_MIMES)} />
          </label>
          {fileErrors.Fichiers_D && <span className="ins-field-error" role="alert"><i className="fas fa-exclamation-circle" aria-hidden="true" /> {fileErrors.Fichiers_D}</span>}
          {form.Fichiers_D && !fileErrors.Fichiers_D && <span className="ins-field-ok" role="status"><i className="fas fa-check-circle" aria-hidden="true" /> Fichier valide</span>}
        </Field>

        <Field label="Lettre de motivation" hint="PDF, DOC, DOCX — Max 20 Mo" htmlFor="f-lettre">
          <label className="ins-file-label" htmlFor="f-lettre">
            <i className="fas fa-envelope-open-text" aria-hidden="true" />
            <span>{form.Lettre_M ? sanitizeText(form.Lettre_M.name) : "Choisir un fichier"}</span>
            <input id="f-lettre" type="file" style={{ display: "none" }}
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange("Lettre_M", LETTRE_EXTS, LETTRE_MIMES)} />
          </label>
          {fileErrors.Lettre_M && <span className="ins-field-error" role="alert"><i className="fas fa-exclamation-circle" aria-hidden="true" /> {fileErrors.Lettre_M}</span>}
          {form.Lettre_M && !fileErrors.Lettre_M && <span className="ins-field-ok" role="status"><i className="fas fa-check-circle" aria-hidden="true" /> Fichier valide</span>}
        </Field>
      </div>

      <div className="ins-nav-btns">
        <button className="ins-btn ins-btn--ghost" onClick={onBack}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> Retour
        </button>
        <button className="ins-btn ins-btn--primary" onClick={onNext}>
          Suivant <i className="fas fa-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4 — Password ────────────────────────────────────────────────────────
function StepPassword({ form, setForm, onSubmit, onBack, submitting }) {
  const [showMdp,  setShowMdp]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const pwdOk     = form.mdp && form.mdp.length >= 8;
  const match     = form.mdp === form.mdpConfirm;
  const canSubmit = pwdOk && match;

  const strength = !form.mdp ? 0
    : form.mdp.length < 8  ? 1
    : form.mdp.length < 12 ? 2
    : /[A-Z]/.test(form.mdp) && /[0-9]/.test(form.mdp) && /[^A-Za-z0-9]/.test(form.mdp) ? 4 : 3;

  const strengthLabel = ["", "Faible", "Moyen", "Fort", "Très fort"];
  const strengthClass = ["", "weak", "fair", "strong", "vstrong"];

  const handleSubmit = () => {
    if (!pwdOk) {
      Swal.fire({ icon: 'error', title: 'Mot de passe trop court', text: 'Minimum 8 caractères.' });
      return;
    }
    if (!match) {
      Swal.fire({ icon: 'error', title: 'Confirmation incorrecte', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    onSubmit();
  };

  return (
    <div className="ins-step-content">
      <div className="ins-step-header">
        <div className="ins-step-icon ins-step-icon--5" aria-hidden="true"><i className="fas fa-lock" /></div>
        <h3>Sécurité du compte</h3>
        <p>Choisissez un mot de passe sécurisé</p>
      </div>

      <div className="ins-grid-1">
        <Field label="Mot de passe" required hint="Minimum 8 caractères" htmlFor="f-mdp">
          <div className="ins-input-eye">
            <input id="f-mdp" className="ins-input"
              type={showMdp ? "text" : "password"}
              value={form.mdp}
              onChange={(e) => set("mdp")(e.target.value.slice(0, 128))}
              placeholder="••••••••" autoComplete="new-password" maxLength={128}
              aria-describedby="mdp-strength"
            />
            <button type="button" className="ins-eye" onClick={() => setShowMdp(!showMdp)}
              aria-label={showMdp ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
              <i className={`fas fa-eye${showMdp ? "-slash" : ""}`} aria-hidden="true" />
            </button>
          </div>
          {form.mdp && (
            <div className="ins-strength" id="mdp-strength" aria-live="polite">
              <div className={`ins-strength__bar ins-strength__bar--${strengthClass[strength]}`}
                style={{ width: `${strength * 25}%` }}
                role="progressbar" aria-valuenow={strength * 25} aria-valuemin={0} aria-valuemax={100}
                aria-label={`Force du mot de passe : ${strengthLabel[strength]}`} />
              <span className={`ins-strength__label ins-strength__label--${strengthClass[strength]}`}>
                {strengthLabel[strength]}
              </span>
            </div>
          )}
        </Field>

        <Field label="Confirmer le mot de passe" required htmlFor="f-mdp-confirm">
          <div className="ins-input-eye">
            <input id="f-mdp-confirm" className="ins-input"
              type={showConf ? "text" : "password"}
              value={form.mdpConfirm}
              onChange={(e) => set("mdpConfirm")(e.target.value.slice(0, 128))}
              placeholder="••••••••" autoComplete="new-password" maxLength={128}
              aria-describedby="mdp-match"
            />
            <button type="button" className="ins-eye" onClick={() => setShowConf(!showConf)}
              aria-label={showConf ? "Masquer la confirmation" : "Afficher la confirmation"}>
              <i className={`fas fa-eye${showConf ? "-slash" : ""}`} aria-hidden="true" />
            </button>
          </div>
          {form.mdpConfirm && (
            <p id="mdp-match" className={`ins-match-msg${match ? " ok" : " ko"}`} role="alert">
              <i className={`fas fa-${match ? "check" : "times"}-circle`} aria-hidden="true" />
              {match ? " Les mots de passe correspondent" : " Les mots de passe ne correspondent pas"}
            </p>
          )}
        </Field>
      </div>

      <div className="ins-nav-btns">
        <button className="ins-btn ins-btn--ghost" onClick={onBack} disabled={submitting}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> Retour
        </button>
        <button className="ins-btn ins-btn--submit" onClick={handleSubmit}
          disabled={!canSubmit || submitting} aria-busy={submitting}>
          {submitting
            ? <><div className="ins-spinner ins-spinner--sm" aria-hidden="true" /> Création…</>
            : <>Créer mon compte</>}
        </button>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <div className="ins-success" role="status" aria-live="polite">
      <div className="ins-success__circle" aria-hidden="true"><i className="fas fa-check" /></div>
      <h3>Compte créé avec succès !</h3>
      <p>Bienvenue sur Zenselekt. Vous allez être redirigé vers votre espace.</p>
      <Link to="/connexion" className="ins-btn ins-btn--primary ins-btn--lg">
        <i className="fas fa-sign-in-alt" aria-hidden="true" /> Accéder à mon espace
      </Link>
    </div>
  );
}

// ─── Root Inscription ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  nom:"", prenoms:"", email:"", tel:"", telwhat:"", Genre:"", date_N:"",
  Lieu_N:"", Pays_N:"Côte d'Ivoire", Pays_R:"Côte d'Ivoire",
  Situation_M:"", Nombre_E:"",
  Commune:"", Quartier:"",
  Secteur:"", Niveau:"", Niveau_A:"", Ref_P:"", Ref_A:"",
  Fichiers_D: null, Lettre_M: null,
  mdp:"", mdpConfirm:""
};

export default function Inscription() {
  const [step,       setStep]       = useState(0);
  const [cvFile,     setCvFile]     = useState(null);
  const [cvData,     setCvData]     = useState({});
  const [cvToken,    setCvToken]    = useState("");
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  // ── Chargement initial du token CSRF ──────────────────────────────────────
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const handleCvData = (data) => {
    if (!data) return;
    setForm(f => ({
      ...f,
      nom:         data.nom                                  || f.nom,
      prenoms:     data.prenoms                              || f.prenoms,
      email:       data.email                                || f.email,
      tel:         data.tel                                  || f.tel,
      Genre:       mapGenre(data.genre)                      || f.Genre,
      date_N:      data.date_naissance                       || f.date_N,
      Lieu_N:      data.lieu_naissance                       || f.Lieu_N,
      Pays_N:      data.pays_naissance                       || f.Pays_N,
      Pays_R:      data.pays_residence                       || f.Pays_R,
      Situation_M: mapSituation(data.situation_matrimoniale) || f.Situation_M,
      Nombre_E:    data.nombre_enfants                       || f.Nombre_E,
      Commune:     data.commune                              || f.Commune,
      Quartier:    data.quartier                             || f.Quartier,
      Secteur:     data.secteur_activite                     || f.Secteur,
      Niveau:      data.niveau_academique                    || f.Niveau,
      Niveau_A:    data.niveau_anglais                       || f.Niveau_A,
      Ref_P:       data.references_professionnelles          || f.Ref_P,
      Ref_A:       data.references_academiques               || f.Ref_A,
    }));
    setCvData(data);
  };

  const mapGenre = (g) => {
    if (!g) return "";
    const lower = g.toLowerCase();
    if (lower === "homme" || lower === "male"   || lower === "m") return "Homme";
    if (lower === "femme" || lower === "female" || lower === "f") return "Femme";
    return "";
  };

  const mapSituation = (s) => {
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower.includes("mari"))                                  return "Marié(e)";
    if (lower.includes("celibat") || lower.includes("célibat")) return "Célibataire";
    if (lower.includes("pacse")   || lower.includes("pacsé"))   return "Pacsé(e)";
    if (lower.includes("veuf")    || lower.includes("veuve"))    return "Veuf(ve)";
    if (lower.includes("divorc"))                                return "Divorcé(e)";
    return "";
  };

  const next = () => { window.scrollTo({ top: 0, behavior: "smooth" }); setStep(s => s + 1); };
  const back = () => { window.scrollTo({ top: 0, behavior: "smooth" }); setStep(s => s - 1); };

  const handleSubmit = async () => {
    // ── Vérification rate limit côté client ───────────────────────────────
    if (isRateLimited()) {
      const h = getTimeUntilUnlock();
      Swal.fire({
        icon:  'error',
        title: 'Trop de tentatives',
        text:  `Vous avez atteint la limite de ${MAX_ATTEMPTS} tentatives. Réessayez dans ${h ?? 24}h.`,
        confirmButtonColor: '#d33',
      });
      return;
    }

    setSubmitting(true);

    // ── Si le token CSRF est absent, le recharger avant d'envoyer ─────────
    if (!_csrfToken) {
      await fetchCsrfToken();
      if (!_csrfToken) {
        Swal.fire({ icon: 'error', title: 'Erreur de session', text: 'Impossible d\'obtenir un token de sécurité. Rechargez la page.' });
        setSubmitting(false);
        return;
      }
    }

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          fd.append(key, String(value));
        }
      });
      fd.append("cv_token",   cvToken);
      fd.append("csrf_token", _csrfToken ?? "");
      if (form.Fichiers_D) fd.append("Fichiers_D", form.Fichiers_D);
      if (form.Lettre_M)   fd.append("Lettre_M",   form.Lettre_M);

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 30000);

      let res;
      try {
        res = await fetch(`${API_BASE}/inscription/submit`, {
          method:      "POST",
          credentials: "include",
          headers:     { "X-CSRF-Token": _csrfToken ?? "" },
          body:        fd,
          signal:      controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Rotation du token CSRF
      refreshCsrfFromResponse(res);

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Réponse serveur inattendue (non-JSON).");
      }

      const data = await res.json();

      // Token CSRF invalide / expiré → recharger silencieusement et informer
      if (res.status === 403) {
        await fetchCsrfToken();
        Swal.fire({
          icon:  'warning',
          title: 'Session expirée',
          text:  data.message || "Votre session a expiré. Veuillez réessayer.",
        });
        setSubmitting(false);
        return;
      }

      if (res.status === 429) {
        const msg = data.errors?.[0] || "Trop de tentatives. Réessayez dans 24h.";
        recordFailedAttempt();
        Swal.fire({ icon: 'error', title: 'Trop de tentatives', text: msg, confirmButtonColor: '#d33' });
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        recordFailedAttempt();
        let errorMsg = "Erreur lors de l'inscription.";
        if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
          errorMsg = Object.values(data.errors).flat().join(", ");
        } else if (Array.isArray(data.errors)) {
          errorMsg = data.errors.join(", ");
        } else if (data.message) {
          errorMsg = data.message;
        }
        Swal.fire({ icon: 'error', title: 'Inscription échouée', text: errorMsg });
        setSubmitting(false);
        return;
      }

      if (data.success) {
        resetRateLimit();
        setDone(true);
        Swal.fire({
          icon:               'success',
          title:              'Compte créé !',
          text:               'Bienvenue sur Zenselekt. Redirection vers votre espace...',
          timer:              2500,
          showConfirmButton:  false,
          willClose:          () => { window.location.href = '/connexion'; },
        });
      } else {
        recordFailedAttempt();
        Swal.fire({
          icon:  'error',
          title: 'Erreur',
          text:  Array.isArray(data.errors) ? data.errors.join(", ") : "Une erreur inconnue est survenue.",
        });
      }

    } catch (err) {
      if (err.name === "AbortError") {
        Swal.fire({ icon: 'error', title: 'Timeout', text: 'La requête a expiré. Vérifiez votre connexion.' });
      } else {
        Swal.fire({ icon: 'error', title: 'Erreur réseau', text: err.message || "Impossible de contacter le serveur." });
      }
    }

    setSubmitting(false);
  };

  const reset = () => {
    setStep(0);
    setCvFile(null);
    setCvData({});
    setCvToken("");
    setForm(EMPTY_FORM);
    setDone(false);
    localStorage.removeItem(RATE_LIMIT_KEY);
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
            <h1>Créer mon compte Talent</h1>
          </div>

          {done ? (
            <SuccessScreen />
          ) : (
            <>
              <StepBar current={step} />

              {step === 0 && (
                <StepCV
                  onNext={next}
                  cvData={cvData}
                  setCvData={handleCvData}
                  cvFile={cvFile}
                  setCvFile={setCvFile}
                  setCvToken={setCvToken}
                />
              )}
              {step === 1 && <StepPersonal  form={form} setForm={setForm} onNext={next} onBack={back} />}
              {step === 2 && <StepPro       form={form} setForm={setForm} onNext={next} onBack={back} />}
              {step === 3 && <StepDocuments form={form} setForm={setForm} onNext={next} onBack={back} />}
              {step === 4 && (
                <StepPassword
                  form={form} setForm={setForm}
                  onSubmit={handleSubmit} onBack={back}
                  submitting={submitting}
                />
              )}

              <div className="ins-reset">
                <button className="ins-reset__btn" onClick={reset} aria-label="Recommencer le formulaire depuis le début">
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