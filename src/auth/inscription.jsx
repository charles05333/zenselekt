import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "./css/Inscription.css";
import zenImg from "../assets/img/zen.png";

// ─── Constants ────────────────────────────────────────────────────────────────
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
  "Bailleur / Organisme international","Agroalimentaire","Banque / Assurance",
  "Bois / Papier / Carton / Imprimerie","BTP / Matériaux de construction","Chimie / Parachimie",
  "Commerce / Négoce / Distribution","Édition / Communication / Multimédia","Education Formation",
  "Électronique / Électricité","Environnement","Études et conseils","Finance / Comptabilité",
  "Industrie pharmaceutique","Informatique / Télécoms","Machines et équipements / Automobile",
  "Management","Métallurgie / Travail du métal","Plastique / Caoutchouc","Santé","Sécurité",
  "Services aux entreprises","Textile / Habillement / Chaussure","Transports / Logistique"
];

const STEPS = ["CV", "Informations", "Professionnel", "Documents", "Sécurité"];

// ─── Security helpers ─────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 Mo

/** Supprime les balises HTML/JS d'une chaîne (protection XSS côté affichage) */
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

/** Validation email RFC-5322 simplifiée */
function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

/** Validation téléphone international : chiffres, espaces, +, tirets — min 8 chiffres */
function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 && /^[+\d\s\-().]+$/.test(phone);
}

/** Vérifie l'extension ET le magic number MIME déclaré par le navigateur */
function validateFile(file, allowedExts, allowedMimes) {
  if (!file) return { ok: false, error: "Aucun fichier sélectionné." };
  const ext = file.name.split(".").pop().toLowerCase();
  if (!allowedExts.includes(ext)) {
    return { ok: false, error: `Extension non autorisée. Formats acceptés : ${allowedExts.join(", ").toUpperCase()}.` };
  }
  // Vérification du type MIME déclaré par le navigateur (couche supplémentaire)
  if (allowedMimes && !allowedMimes.includes(file.type)) {
    return { ok: false, error: `Type de fichier invalide (MIME non autorisé).` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "Le fichier ne doit pas dépasser 20 Mo." };
  }
  if (file.size === 0) {
    return { ok: false, error: "Le fichier est vide." };
  }
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

const LETTRE_EXTS  = ["pdf", "doc", "docx"];
const LETTRE_MIMES = [
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
  const handleChange = (e) => {
    // On limite la longueur et on ne laisse pas passer de balises HTML
    const val = e.target.value.slice(0, maxLength);
    onChange(val);
  };
  return (
    <input
      id={id}
      className="ins-input"
      type={type}
      value={value}
      onChange={handleChange}
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

// ─── Step 0 — CV Upload ───────────────────────────────────────────────────────
function StepCV({ onNext, cvData, setCvData, cvFile, setCvFile }) {
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const inputRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError("");

    const validation = validateFile(file, CV_EXTS, CV_MIMES);
    if (!validation.ok) { setError(validation.error); return; }

    setCvFile(file);
    setLoading(true);

    // 🔌 Remplace par ton vrai appel API :
    // const fd = new FormData();
    // fd.append("Fichier_cv", file);
    // fd.append("action", "upload_cv");
    // fd.append("csrf_token", window.CSRF_TOKEN);
    // const res = await fetch("/api/inscription.php", {
    //   method: "POST",
    //   credentials: "same-origin",  // sécurité : envoie les cookies de session
    //   headers: { "X-Requested-With": "XMLHttpRequest" }, // protection CSRF supplémentaire
    //   body: fd
    // });
    // if (!res.ok) { setError("Erreur serveur. Veuillez réessayer."); setLoading(false); return; }
    // const data = await res.json();
    // if (data.success && data.is_valid_cv) { setCvData(data.data); setLoading(false); }
    // else { setError(data.errors?.[0] || "Erreur d'analyse."); setCvFile(null); setLoading(false); }

    // Simulation (supprime ce bloc quand tu branches l'API) :
    await new Promise(r => setTimeout(r, 1800));
    setCvData({ nom: "Dupont", prenoms: "Jean", email: "jean@example.com", tel: "0102030405" });
    setLoading(false);
  }, [setCvFile, setCvData]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };

  return (
    <div className="ins-step-content">
      

      {!cvFile ? (
        <div
          className={`ins-dropzone${dragging ? " dragging" : ""}`}
          onDragOver={onDragOver}
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
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => handleFile(e.target.files[0])}
            tabIndex={-1}
            aria-hidden="true"
          />
          <i className="fas fa-cloud-upload-alt ins-dropzone__icon" aria-hidden="true" />
          <p className="ins-dropzone__text">Glissez votre CV ici</p>
          <p className="ins-dropzone__sub">ou cliquez pour sélectionner</p>
          <p className="ins-dropzone__formats">PDF · DOC · DOCX · JPG · PNG — Max 20 Mo</p>
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
          {/* sanitizeText pour l'affichage du nom de fichier */}
          <p className="ins-cv-ready__name">{sanitizeText(cvFile.name)}</p>
          <p className="ins-cv-ready__info">CV analysé avec succès</p>
          <div className="ins-cv-ready__actions">
            <button className="ins-btn ins-btn--ghost" onClick={() => { setCvFile(null); setCvData({}); }}>
              <i className="fas fa-redo" aria-hidden="true" /> Changer
            </button>
            <button className="ins-btn ins-btn--primary" onClick={onNext}>
              Continuer <i className="fas fa-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="ins-error-msg" role="alert" aria-live="assertive">
          <i className="fas fa-exclamation-circle" aria-hidden="true" /> {error}
        </p>
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
    if (form.email && !isValidEmail(form.email)) errs.email = "Adresse email invalide.";
    if (form.tel && !isValidPhone(form.tel)) errs.tel = "Numéro de téléphone invalide.";
    if (form.telwhat && !isValidPhone(form.telwhat)) errs.telwhat = "Numéro WhatsApp invalide.";

    // Validation de la date de naissance : doit être dans le passé et l'utilisateur doit avoir ≥ 16 ans
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
      <div className="ins-step-header">
       
        <h3>Informations personnelles</h3>
      </div>

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
        <Field label="WhatsApp" htmlFor="f-telwhat">
          <Input id="f-telwhat" type="tel" value={form.telwhat} onChange={set("telwhat")} placeholder="+225 07 00 00 00 00" maxLength={20} />
          {fieldErrors.telwhat && <span className="ins-field-error" role="alert">{fieldErrors.telwhat}</span>}
        </Field>
        <Field label="Genre" required htmlFor="f-genre">
          <Select id="f-genre" value={form.Genre} onChange={set("Genre")} options={[{value:"Homme",label:"Homme"},{value:"Femme",label:"Femme"}]} />
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
          <Select id="f-situation" value={form.Situation_M} onChange={set("Situation_M")} options={["Célibataire","Marié(e)","Pacsé(e)","Veuf(ve)","Divorcé(e)"]} />
          {fieldErrors.Situation_M && <span className="ins-field-error" role="alert">{fieldErrors.Situation_M}</span>}
        </Field>
        <Field label="Nombre d'enfants" htmlFor="f-enfants">
          <Input id="f-enfants" type="number" value={form.Nombre_E} onChange={set("Nombre_E")} min={0} max={20} placeholder="0" />
        </Field>
        <Field label="Commune / Ville" htmlFor="f-commune">
          <Input id="f-commune" value={form.Commune} onChange={set("Commune")} placeholder="Ex: Abidjan" maxLength={100} />
        </Field>
        <Field label="Quartier" htmlFor="f-quartier">
          <Input id="f-quartier" value={form.Quartier} onChange={set("Quartier")} placeholder="Ex: Cocody" maxLength={100} />
        </Field>
      </div>

      <div className="ins-nav-btns">
        <button className="ins-btn ins-btn--ghost" onClick={onBack}><i className="fas fa-arrow-left" aria-hidden="true" /> Retour</button>
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
      <div className="ins-step-header">
        
        <h3>Profil professionnel</h3>
      </div>

      {/* Champs selects groupés */}
      <div className="ins-grid-2">
        <Field label="Secteur d'activité" required htmlFor="f-secteur">
          <Select id="f-secteur" value={form.Secteur} onChange={set("Secteur")} options={SECTEURS} />
        </Field>
        <Field label="Niveau académique" required htmlFor="f-niveau">
          <Select id="f-niveau" value={form.Niveau} onChange={set("Niveau")} options={[
            {value:"certificat",label:"Certificat"},{value:"bac",label:"Bac"},
            {value:"bts",label:"BTS"},{value:"dts",label:"DTS"},{value:"dut",label:"DUT"},
            {value:"licence",label:"Licence"},{value:"ingenieur",label:"Ingénieur"},
            {value:"master",label:"Master"},{value:"doctorat",label:"Doctorat"}
          ]} />
        </Field>
        <Field label="Niveau d'anglais" required htmlFor="f-anglais">
          <Select id="f-anglais" value={form.Niveau_A} onChange={set("Niveau_A")} options={[
            {value:"faible",label:"Faible"},{value:"moyen",label:"Moyen"},
            {value:"courant",label:"Courant"},{value:"bilingue",label:"Bilingue"}
          ]} />
        </Field>
      </div>

      {/* ↓ Séparateur visuel + espacement entre selects et références */}
      <div className="ins-section-divider" aria-hidden="true" />

      {/* Références dans une grille pleine largeur */}
      <div className="ins-grid-2 ins-grid-2--full">
        <Field label="Références professionnelles (min. 3)" hint="Nom, Fonction, Contact" htmlFor="f-ref-pro">
          <textarea
            id="f-ref-pro"
            className="ins-input ins-textarea"
            rows={5}
            value={form.Ref_P}
            onChange={(e) => set("Ref_P")(e.target.value.slice(0, 2000))}
            placeholder="Ex: M. Kouadio, DRH Chez ABC, +225 07 00 00 00"
            maxLength={2000}
            spellCheck={false}
          />
        </Field>
        <Field label="Références académiques (min. 3)" hint="Nom, Institution, Contact" htmlFor="f-ref-aca">
          <textarea
            id="f-ref-aca"
            className="ins-input ins-textarea"
            rows={5}
            value={form.Ref_A}
            onChange={(e) => set("Ref_A")(e.target.value.slice(0, 2000))}
            placeholder="Ex: Dr. Traoré, Université HEC, +225 07 00 00 00"
            maxLength={2000}
            spellCheck={false}
          />
        </Field>
      </div>

      <div className="ins-nav-btns">
        <button className="ins-btn ins-btn--ghost" onClick={onBack}><i className="fas fa-arrow-left" aria-hidden="true" /> Retour</button>
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
    // Réinitialise la valeur de l'input pour permettre de re-sélectionner le même fichier après erreur
    e.target.value = "";

    if (!file) return;

    const validation = validateFile(file, allowedExts, allowedMimes);
    if (!validation.ok) {
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
        {/* Diplôme */}
        <Field label="Diplôme" hint="Formats acceptés : PDF, DOC, DOCX, JPG, PNG — Max 20 Mo" htmlFor="f-diplome">
          <label className="ins-file-label" htmlFor="f-diplome">
            <i className="fas fa-graduation-cap" aria-hidden="true" />
            <span>{form.Fichiers_D ? sanitizeText(form.Fichiers_D.name) : "Choisir un fichier"}</span>
            <input
              id="f-diplome"
              type="file"
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange("Fichiers_D", DIPLOME_EXTS, DIPLOME_MIMES)}
            />
          </label>
          {fileErrors.Fichiers_D && (
            <span className="ins-field-error" role="alert">
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {fileErrors.Fichiers_D}
            </span>
          )}
          {form.Fichiers_D && !fileErrors.Fichiers_D && (
            <span className="ins-field-ok" role="status">
              <i className="fas fa-check-circle" aria-hidden="true" /> Fichier valide
            </span>
          )}
        </Field>

        {/* Lettre de motivation */}
        <Field label="Lettre de motivation" hint="Formats acceptés : PDF, DOC, DOCX — Max 20 Mo" htmlFor="f-lettre">
          <label className="ins-file-label" htmlFor="f-lettre">
            <i className="fas fa-envelope-open-text" aria-hidden="true" />
            <span>{form.Lettre_M ? sanitizeText(form.Lettre_M.name) : "Choisir un fichier"}</span>
            <input
              id="f-lettre"
              type="file"
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange("Lettre_M", LETTRE_EXTS, LETTRE_MIMES)}
            />
          </label>
          {fileErrors.Lettre_M && (
            <span className="ins-field-error" role="alert">
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {fileErrors.Lettre_M}
            </span>
          )}
          {form.Lettre_M && !fileErrors.Lettre_M && (
            <span className="ins-field-ok" role="status">
              <i className="fas fa-check-circle" aria-hidden="true" /> Fichier valide
            </span>
          )}
        </Field>
      </div>

      <div className="ins-nav-btns">
        <button className="ins-btn ins-btn--ghost" onClick={onBack}><i className="fas fa-arrow-left" aria-hidden="true" /> Retour</button>
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

  // Règles de robustesse : min 8 car., 1 maj., 1 chiffre, 1 spécial (NIST / OWASP)
  const pwdOk = form.mdp && form.mdp.length >= 8;
  const match = form.mdp === form.mdpConfirm;
  const canSubmit = pwdOk && match;

  const strength = !form.mdp ? 0
    : form.mdp.length < 8  ? 1
    : form.mdp.length < 12 ? 2
    : /[A-Z]/.test(form.mdp) && /[0-9]/.test(form.mdp) && /[^A-Za-z0-9]/.test(form.mdp) ? 4 : 3;

  const strengthLabel = ["", "Faible", "Moyen", "Fort", "Très fort"];
  const strengthClass = ["", "weak", "fair", "strong", "vstrong"];

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
            <input
              id="f-mdp"
              className="ins-input"
              type={showMdp ? "text" : "password"}
              value={form.mdp}
              onChange={(e) => set("mdp")(e.target.value.slice(0, 128))}
              placeholder="••••••••"
              autoComplete="new-password"
              maxLength={128}
              aria-describedby="mdp-strength"
            />
            <button
              type="button"
              className="ins-eye"
              onClick={() => setShowMdp(!showMdp)}
              aria-label={showMdp ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              <i className={`fas fa-eye${showMdp ? "-slash" : ""}`} aria-hidden="true" />
            </button>
          </div>
          {form.mdp && (
            <div className="ins-strength" id="mdp-strength" aria-live="polite">
              <div
                className={`ins-strength__bar ins-strength__bar--${strengthClass[strength]}`}
                style={{ width: `${strength * 25}%` }}
                role="progressbar"
                aria-valuenow={strength * 25}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Force du mot de passe : ${strengthLabel[strength]}`}
              />
              <span className={`ins-strength__label ins-strength__label--${strengthClass[strength]}`}>
                {strengthLabel[strength]}
              </span>
            </div>
          )}
        </Field>

        <Field label="Confirmer le mot de passe" required htmlFor="f-mdp-confirm">
          <div className="ins-input-eye">
            <input
              id="f-mdp-confirm"
              className="ins-input"
              type={showConf ? "text" : "password"}
              value={form.mdpConfirm}
              onChange={(e) => set("mdpConfirm")(e.target.value.slice(0, 128))}
              placeholder="••••••••"
              autoComplete="new-password"
              maxLength={128}
              aria-describedby="mdp-match"
            />
            <button
              type="button"
              className="ins-eye"
              onClick={() => setShowConf(!showConf)}
              aria-label={showConf ? "Masquer la confirmation" : "Afficher la confirmation"}
            >
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
        <button
          className="ins-btn ins-btn--submit"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          aria-busy={submitting}
        >
          {submitting
            ? <><div className="ins-spinner ins-spinner--sm" aria-hidden="true" /> Création…</>
            : <><i className="fas fa-check" aria-hidden="true" /> Créer mon compte</>}
        </button>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <div className="ins-success" role="status" aria-live="polite">
      <div className="ins-success__circle" aria-hidden="true">
        <i className="fas fa-check" />
      </div>
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
  Lieu_N:"", Pays_N:"Côte d'Ivoire", Pays_R:"Côte d'Ivoire",  // ← défaut Côte d'Ivoire
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
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [errors,     setErrors]     = useState([]);

  // Pré-remplissage à partir du CV analysé
  const handleCvData = (data) => {
    // On ne laisse passer que les champs attendus (whitelist) pour éviter la pollution de l'état
    const allowed = ["nom", "prenoms", "email", "tel"];
    const safeData = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed.includes(k))
    );
    setCvData(safeData);
    setForm(f => ({ ...f, ...safeData }));
  };

  const next = () => { window.scrollTo({ top: 0, behavior: "smooth" }); setStep(s => s + 1); setErrors([]); };
  const back = () => { window.scrollTo({ top: 0, behavior: "smooth" }); setStep(s => s - 1); setErrors([]); };

  const handleSubmit = async () => {
    setSubmitting(true); setErrors([]);

    // 🔌 Remplace par ton vrai appel API :
    // const fd = new FormData();
    // const textFields = Object.entries(form).filter(([,v]) => typeof v === "string" || typeof v === "number");
    // textFields.forEach(([k,v]) => fd.append(k, v));
    // if (cvFile) fd.append("Fichier_cv", cvFile);
    // if (form.Fichiers_D) fd.append("Fichiers_D", form.Fichiers_D);
    // if (form.Lettre_M)   fd.append("Lettre_M",   form.Lettre_M);
    // fd.append("action", "submit_form");
    // fd.append("csrf_token", window.CSRF_TOKEN);
    // const res = await fetch("/api/inscription.php", {
    //   method: "POST",
    //   credentials: "same-origin",
    //   headers: { "X-Requested-With": "XMLHttpRequest" },
    //   body: fd
    // });
    // if (!res.ok) { setErrors(["Erreur serveur. Veuillez réessayer."]); setSubmitting(false); return; }
    // const data = await res.json();
    // if (data.success) { setDone(true); }
    // else { setErrors(data.errors || ["Erreur inconnue"]); }

    // Simulation :
    await new Promise(r => setTimeout(r, 2000));
    setDone(true);
    setSubmitting(false);
  };

  const reset = () => {
    setStep(0); setCvFile(null); setCvData({});
    setForm(EMPTY_FORM); setDone(false); setErrors([]);
  };

  return (
    <div className="ins-page">
      {/* Top bar */}
      <header className="ins-topbar">
        <Link to="/" className="ins-topbar__back" aria-label="Retour à l'accueil">
          <i className="fas fa-arrow-left" aria-hidden="true" /> Accueil
        </Link>
        <img src={zenImg} alt="Zenselekt — retour à l'accueil" className="ins-topbar__logo" />
      </header>

      <main className="ins-wrapper">
        <div className="ins-card" role="main">
          {/* Header */}
          <div className="ins-card__header">
            <h1> Créer mon compte Talent</h1>
          </div>

          {done ? (
            <SuccessScreen />
          ) : (
            <>
              <StepBar current={step} />

              {errors.length > 0 && (
                <div className="ins-errors" role="alert" aria-live="assertive">
                  {errors.map((e, i) => (
                    <p key={i}><i className="fas fa-exclamation-circle" aria-hidden="true" /> {e}</p>
                  ))}
                </div>
              )}

              {step === 0 && (
                <StepCV onNext={next} cvData={cvData} setCvData={handleCvData} cvFile={cvFile} setCvFile={setCvFile} />
              )}
              {step === 1 && <StepPersonal  form={form} setForm={setForm} onNext={next} onBack={back} />}
              {step === 2 && <StepPro       form={form} setForm={setForm} onNext={next} onBack={back} />}
              {step === 3 && <StepDocuments form={form} setForm={setForm} onNext={next} onBack={back} />}
              {step === 4 && <StepPassword  form={form} setForm={setForm} onSubmit={handleSubmit} onBack={back} submitting={submitting} />}

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