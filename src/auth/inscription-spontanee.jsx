import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./css/InscriptionSpontanee.css";
import zenImg from "../assets/img/zen.png";

// ─── Constants ────────────────────────────────────────────────────────────────
const SECTEURS = [
  "Bailleur / Organisme international","Agroalimentaire","Banque / Assurance",
  "Bois / Papier / Carton / Imprimerie","BTP / Matériaux de construction","Chimie / Parachimie",
  "Commerce / Négoce / Distribution","Édition / Communication / Multimédia","Education Formation",
  "Électronique / Électricité","Environnement","Études et conseils","Finance / Comptabilité",
  "Industrie pharmaceutique","Informatique / Télécoms","Machines et équipements / Automobile",
  "Management","Métallurgie / Travail du métal","Plastique / Caoutchouc","Santé","Sécurité",
  "Services aux entreprises","Textile / Habillement / Chaussure","Transports / Logistique",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

const CV_EXTS   = ["pdf","doc","docx","jpg","jpeg","png"];
const CV_MIMES  = [
  "application/pdf","application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg","image/png",
];
const LM_EXTS   = ["pdf","doc","docx"];
const LM_MIMES  = [
  "application/pdf","application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ─── Security helpers ─────────────────────────────────────────────────────────
function sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;");
}
function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}
function isValidPhone(phone) {
  const digits = phone.replace(/\D/g,"");
  return digits.length >= 8 && digits.length <= 15 && /^[+\d\s\-().]+$/.test(phone);
}
function validateFile(file, allowedExts, allowedMimes) {
  if (!file) return { ok: false, error: "Aucun fichier sélectionné." };
  const ext = file.name.split(".").pop().toLowerCase();
  if (!allowedExts.includes(ext))
    return { ok: false, error: `Extension non autorisée. Formats : ${allowedExts.join(", ").toUpperCase()}.` };
  if (allowedMimes && !allowedMimes.includes(file.type))
    return { ok: false, error: "Type de fichier invalide (MIME non autorisé)." };
  if (file.size > MAX_FILE_SIZE)
    return { ok: false, error: "Le fichier ne doit pas dépasser 10 Mo." };
  if (file.size === 0)
    return { ok: false, error: "Le fichier est vide." };
  return { ok: true };
}

// ─── Reusable Field ───────────────────────────────────────────────────────────
function Field({ label, required, hint, children, htmlFor }) {
  return (
    <div className="sp-field">
      <label className="sp-label" htmlFor={htmlFor}>
        {label}{required && <span className="sp-required" aria-label="obligatoire"> *</span>}
      </label>
      {children}
      {hint && <small className="sp-hint">{hint}</small>}
    </div>
  );
}

function Input({ id, value, onChange, type="text", placeholder, min, max, maxLength=255, autoComplete, required }) {
  return (
    <input
      id={id} className="sp-input" type={type} value={value}
      onChange={e => onChange(e.target.value.slice(0, maxLength))}
      placeholder={placeholder} min={min} max={max}
      maxLength={maxLength} autoComplete={autoComplete || "off"}
      required={required} spellCheck={false}
    />
  );
}

function Select({ id, value, onChange, options, placeholder="Sélectionner", required }) {
  return (
    <select id={id} className="sp-input sp-select" value={value}
      onChange={e => onChange(e.target.value)} required={required}>
      <option value="">{placeholder}</option>
      {options.map(opt =>
        typeof opt === "string"
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onFileReady, onError }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    const v = validateFile(file, CV_EXTS, CV_MIMES);
    if (!v.ok) { onError(v.error); return; }
    onFileReady(file);
  }, [onFileReady, onError]);

  return (
    <div
      className={`sp-dropzone${dragging ? " dragging" : ""}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current.click()}
      role="button" tabIndex={0}
      aria-label="Zone de dépôt du CV"
      onKeyDown={e => e.key === "Enter" && inputRef.current.click()}
    >
      <input ref={inputRef} type="file" style={{ display:"none" }}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" tabIndex={-1} aria-hidden="true"
        onChange={e => handleFile(e.target.files[0])} />
      <i className="fas fa-cloud-upload-alt sp-dropzone__icon" aria-hidden="true" />
      <h3 className="sp-dropzone__title">Déposez votre CV ici</h3>
      <p className="sp-dropzone__sub">ou cliquez pour sélectionner</p>
      <p className="sp-dropzone__formats">PDF · DOC · DOCX · JPG · PNG — Max 10 Mo</p>
    </div>
  );
}

// ─── Loading overlay ──────────────────────────────────────────────────────────
function LoadingOverlay({ title, message }) {
  return (
    <div className="sp-overlay" role="status" aria-live="polite">
      <div className="sp-overlay__box">
        <div className="sp-spinner" aria-hidden="true" />
        <h4 className="sp-overlay__title">{title}</h4>
        <p className="sp-overlay__msg">{message}</p>
      </div>
    </div>
  );
}

// ─── CV Step ──────────────────────────────────────────────────────────────────
function StepUpload({ onSuccess, onError }) {
  const [cvFile, setCvFile]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleFile = async (file) => {
    setError("");
    setCvFile(file);
    setLoading(true);

    // 🔌 Vrai appel API :
    // const fd = new FormData();
    // fd.append("Fichier_cv", file);
    // fd.append("action", "upload_cv");
    // fd.append("csrf_token", window.CSRF_TOKEN);
    // const res = await fetch("/inscriptionSpontan.php", {
    //   method: "POST", credentials: "same-origin",
    //   headers: { "X-Requested-With": "XMLHttpRequest" }, body: fd
    // });
    // if (!res.ok) { setError("Erreur serveur. Veuillez réessayer."); setLoading(false); return; }
    // const data = await res.json();
    // if (data.success && data.is_valid_cv) { onSuccess(file, data.data || {}); }
    // else if (data.extraction_failed) { setError("Extraction impossible. Vérifiez le fichier."); setCvFile(null); }
    // else if (!data.is_valid_cv) { setError(data.errors?.[0] || "Ce fichier ne semble pas être un CV valide."); setCvFile(null); }
    // else { setError(data.errors?.[0] || "Erreur d'analyse."); setCvFile(null); }
    // setLoading(false);

    // Simulation :
    await new Promise(r => setTimeout(r, 2000));
    onSuccess(file, { nom:"Dupont", prenoms:"Jean", email:"jean@example.com", tel:"0102030405" });
    setLoading(false);
  };

  const handleError = (msg) => setError(msg);

  if (loading) {
    return <LoadingOverlay title="Analyse du CV en cours…" message="Extraction automatique des informations" />;
  }

  return (
    <div className="sp-upload-section">
      {!cvFile ? (
        <>
          <UploadZone onFileReady={handleFile} onError={handleError} />
          {error && (
            <p className="sp-error-msg" role="alert" aria-live="assertive">
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {error}
            </p>
          )}
        </>
      ) : (
        <div className="sp-file-ready">
          <div className="sp-file-ready__icon" aria-hidden="true">
            <i className="fas fa-check-circle" />
          </div>
          <p className="sp-file-ready__name">{sanitizeText(cvFile.name)}</p>
          <p className="sp-file-ready__sub">Validation en cours…</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
const EMPTY = {
  nom:"", prenoms:"", email:"", tel:"", date_naissance:"", genre:"",
  secteur_activite:"", niveau_academique:"", niveau_anglais:"",
  commune:"", quartier:"",
  Lettre_M: null,
};

function CandidatureForm({ cvFile, prefill, onReset }) {
  const [form, setForm]           = useState({ ...EMPTY, ...prefill });
  const [lmFile, setLmFile]       = useState(null);
  const [lmError, setLmError]     = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);
  const [globalError, setGlobalError] = useState("");

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleLmFile = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) { setLmFile(null); setLmError(""); return; }
    const v = validateFile(file, LM_EXTS, LM_MIMES);
    if (!v.ok) { setLmError(v.error); setLmFile(null); return; }
    setLmError("");
    setLmFile(file);
  };

  const validate = () => {
    const errs = {};
    
const required = ["nom","prenoms","email","tel","date_naissance","genre","secteur_activite","niveau_academique","niveau_anglais"];
    required.forEach(k => { if (!form[k]?.trim()) errs[k] = "Ce champ est obligatoire."; });
    if (form.email && !isValidEmail(form.email)) errs.email = "Adresse email invalide.";
    if (form.tel && !isValidPhone(form.tel))     errs.tel   = "Numéro invalide.";
    if (form.date_naissance) {
      const dob = new Date(form.date_naissance);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (isNaN(dob.getTime()) || dob >= new Date()) errs.date_naissance = "Date invalide.";
      else if (age < 16) errs.date_naissance = "Vous devez avoir au moins 16 ans.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setGlobalError("");

    // 🔌 Vrai appel API :
    // const fd = new FormData();
    // Object.entries(form).forEach(([k,v]) => { if (typeof v === "string") fd.append(k, v); });
    // fd.append("action", "submit_form");
    // fd.append("csrf_token", window.CSRF_TOKEN);
    // if (cvFile)  fd.append("Fichier_cv", cvFile);
    // if (lmFile)  fd.append("Lettre_M", lmFile);
    // const res = await fetch("/inscriptionSpontan.php", {
    //   method:"POST", credentials:"same-origin",
    //   headers:{ "X-Requested-With":"XMLHttpRequest" }, body:fd
    // });
    // if (!res.ok) { setGlobalError("Erreur serveur. Veuillez réessayer."); setSubmitting(false); return; }
    // const data = await res.json();
    // if (data.success) { setDone(true); }
    // else { setGlobalError(data.errors?.[0] || "Erreur inconnue."); }

    // Simulation :
    await new Promise(r => setTimeout(r, 2000));
    setDone(true);
    setSubmitting(false);
  };

  if (submitting) {
    return <LoadingOverlay title="Envoi en cours…" message="Enregistrement de votre candidature" />;
  }

  if (done) {
    return (
      <div className="sp-success" role="status" aria-live="polite">
        <div className="sp-success__circle" aria-hidden="true">
          <i className="fas fa-check" />
        </div>
        <h3>Candidature envoyée !</h3>
        <p>Merci pour votre intérêt. Nous reviendrons vers vous très prochainement.</p>
        <button className="sp-btn sp-btn--primary sp-btn--lg" onClick={onReset}>
          <i className="fas fa-redo" aria-hidden="true" /> Nouvelle candidature
        </button>
      </div>
    );
  }

  const fe = fieldErrors;

  return (
    <div className="sp-form-wrap">
      {/* CV badge */}
      <div className="sp-cv-badge">
        <i className="fas fa-file-check" aria-hidden="true" />
        <span>CV : <strong>{sanitizeText(cvFile.name)}</strong></span>
        <button className="sp-cv-badge__change" onClick={onReset} aria-label="Changer de CV">
          <i className="fas fa-redo" aria-hidden="true" /> Changer
        </button>
      </div>

      {globalError && (
        <div className="sp-global-error" role="alert" aria-live="assertive">
          <i className="fas fa-exclamation-circle" aria-hidden="true" /> {globalError}
        </div>
      )}

      {/* ── Section 1 : Informations personnelles ── */}
      <h3 className="sp-section-title">
        <span className="sp-section-title__num">1</span> Informations personnelles
      </h3>

      <div className="sp-grid-2">
        <Field label="Nom" required htmlFor="sp-nom">
          <Input id="sp-nom" value={form.nom} onChange={set("nom")} placeholder="Votre nom" maxLength={100} autoComplete="family-name" />
          {fe.nom && <span className="sp-field-error" role="alert">{fe.nom}</span>}
        </Field>
        <Field label="Prénom(s)" required htmlFor="sp-prenoms">
          <Input id="sp-prenoms" value={form.prenoms} onChange={set("prenoms")} placeholder="Vos prénoms" maxLength={100} autoComplete="given-name" />
          {fe.prenoms && <span className="sp-field-error" role="alert">{fe.prenoms}</span>}
        </Field>
        <Field label="Email" required htmlFor="sp-email">
          <Input id="sp-email" type="email" value={form.email} onChange={set("email")} placeholder="email@exemple.com" maxLength={254} autoComplete="email" />
          {fe.email && <span className="sp-field-error" role="alert">{fe.email}</span>}
        </Field>
        <Field label="Date de naissance" required htmlFor="sp-dob">
          <Input id="sp-tel" type="tel" value={form.tel} onChange={set("tel")} placeholder="+225 07 00 00 00 00" maxLength={20} autoComplete="tel" />
          {fe.tel && <span className="sp-field-error" role="alert">{fe.tel}</span>}
        </Field>
        <Field label="Date de naissance" htmlFor="sp-dob">
          <Input id="sp-dob" type="date" value={form.date_naissance} onChange={set("date_naissance")} max={new Date().toISOString().split("T")[0]} />
          {fe.date_naissance && <span className="sp-field-error" role="alert">{fe.date_naissance}</span>}
        </Field>
       // Genre
<Field label="Genre" required htmlFor="sp-genre">
  <Select id="sp-genre" value={form.genre} onChange={set("genre")} required
    options={[{value:"homme",label:"Homme"},{value:"femme",label:"Femme"}]} />
  {fe.genre && <span className="sp-field-error" role="alert">{fe.genre}</span>}
</Field>
      </div>

      {/* ── Section 2 : Informations professionnelles ── */}
      <h3 className="sp-section-title">
        <span className="sp-section-title__num">2</span> Informations professionnelles
      </h3>

      <div className="sp-grid-2">
        <Field label="Secteur d'activité" required htmlFor="sp-secteur">
          <Select id="sp-secteur" value={form.secteur_activite} onChange={set("secteur_activite")}
            options={SECTEURS} placeholder="Sélectionner le secteur" />
          {fe.secteur_activite && <span className="sp-field-error" role="alert">{fe.secteur_activite}</span>}
        </Field>
        <Field label="Niveau académique" required htmlFor="sp-niveau">
          <Select id="sp-niveau" value={form.niveau_academique} onChange={set("niveau_academique")}
            options={[
              {value:"certificat",label:"Certificat"},{value:"bac",label:"Bac"},
              {value:"bts",label:"BTS"},{value:"dts",label:"DTS"},{value:"dut",label:"DUT"},
              {value:"licence",label:"Licence"},{value:"ingenieur",label:"Ingénieur"},
              {value:"master",label:"Master"},{value:"doctorat",label:"Doctorat"},
            ]} />
          {fe.niveau_academique && <span className="sp-field-error" role="alert">{fe.niveau_academique}</span>}
        </Field>
        <Field label="Niveau d'anglais" required htmlFor="sp-anglais">
          <Select id="sp-anglais" value={form.niveau_anglais} onChange={set("niveau_anglais")}
            options={[
              {value:"faible",label:"Faible"},{value:"moyen",label:"Moyen"},
              {value:"courant",label:"Courant"},{value:"bilingue",label:"Bilingue"},
            ]} />
          {fe.niveau_anglais && <span className="sp-field-error" role="alert">{fe.niveau_anglais}</span>}
        </Field>
      </div>

      {/* ── Section 3 : Localisation ── */}
      <h3 className="sp-section-title">
        <span className="sp-section-title__num">3</span> Localisation
      </h3>

      <div className="sp-grid-2">
        <Field label="Ville / Commune" htmlFor="sp-commune">
          <Input id="sp-commune" value={form.commune} onChange={set("commune")} placeholder="Ex : Abidjan" maxLength={100} />
        </Field>
        <Field label="Quartier" htmlFor="sp-quartier">
          <Input id="sp-quartier" value={form.quartier} onChange={set("quartier")} placeholder="Ex : Cocody" maxLength={100} />
        </Field>
      </div>

      {/* ── Section 4 : Lettre de motivation ── */}
      <h3 className="sp-section-title">
        <span className="sp-section-title__num">4</span> Lettre de motivation
        <span className="sp-section-title__opt"> (facultatif)</span>
      </h3>

      <Field label="Lettre de motivation" hint="PDF, DOC ou DOCX — Max 10 Mo" htmlFor="sp-lettre">
        <label className="sp-file-label" htmlFor="sp-lettre">
          <i className="fas fa-envelope-open-text" aria-hidden="true" />
          <span>{lmFile ? sanitizeText(lmFile.name) : "Choisir un fichier"}</span>
          <input id="sp-lettre" type="file" style={{ display:"none" }}
            accept=".pdf,.doc,.docx" onChange={handleLmFile} />
        </label>
        {lmError && <span className="sp-field-error" role="alert"><i className="fas fa-exclamation-circle" aria-hidden="true" /> {lmError}</span>}
        {lmFile && !lmError && <span className="sp-field-ok" role="status"><i className="fas fa-check-circle" aria-hidden="true" /> Fichier valide</span>}
      </Field>

      {/* ── Submit ── */}
      <div className="sp-submit-row">
        <button className="sp-btn sp-btn--submit" onClick={handleSubmit} aria-busy={submitting}>
          <i className="fas fa-paper-plane" aria-hidden="true" /> Valider ma candidature
        </button>
      </div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function InscriptionSpontanee() {
  const [cvFile,   setCvFile]   = useState(null);
  const [prefill,  setPrefill]  = useState({});
  const [cvError,  setCvError]  = useState("");
  const navigate = useNavigate();

  // ── SweetAlert au chargement ───────────────────────────────
  useEffect(() => {
    if (typeof window.Swal === "undefined") return; // Swal non disponible

    window.Swal.fire({
      html: `
        <div class="sp-swal-body">
          <div class="sp-swal-icon" aria-hidden="true">
            <i class="fas fa-info"></i>
          </div>
          <h2 class="sp-swal-title">Avant de continuer…</h2>
          <p class="sp-swal-text">
            Votre CV sera enregistré dans notre <strong>base de données</strong>
            et étudié par nos recruteurs.
          </p>
          <p class="sp-swal-text">
            Nous vous recommandons de <strong>créer un compte</strong> sur notre plateforme.
          </p>
          <p class="sp-swal-text">
            Vous recevrez automatiquement les <strong>offres correspondant à votre profil</strong> !
          </p>
        </div>
      `,
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonText: "J'ai compris, continuer",
      denyButtonText: "M'inscrire sur le site",
      confirmButtonColor: "#003D5C",
      denyButtonColor: "#5DABA8",
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: 520,
      padding: "32px",
      customClass: {
        popup:          "sp-swal-popup",
        confirmButton:  "sp-swal-btn-confirm",
        denyButton:     "sp-swal-btn-deny",
        actions:        "sp-swal-actions",
        htmlContainer:  "sp-swal-html",
      },
    }).then((result) => {
      if (result.isDenied) {
        // Redirige vers la page d'inscription compte
        navigate("/inscription");
      }
      // Si confirmed → on reste sur la page, rien à faire
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCvSuccess = (file, data) => {
    // Whitelist des champs autorisés depuis l'API
    const allowed = ["nom","prenoms","email","tel"];
    const safe = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed.includes(k))
    );
    setCvFile(file);
    setPrefill(safe);
    setCvError("");
  };

  const handleReset = () => {
    setCvFile(null);
    setPrefill({});
    setCvError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="sp-page">
      {/* Top bar */}
      <header className="sp-topbar">
        <Link to="/" className="ins-topbar__back" aria-label="Retour à l'accueil">
          <i className="fas fa-arrow-left" aria-hidden="true" /> Accueil
        </Link>
        <img src={zenImg} alt="Zenselekt" className="sp-topbar__logo" />
      </header>

      <main className="sp-wrapper">
        <div className="sp-card">
          {/* Header */}
          <div className="sp-card__header">
            <h1> Candidature Spontanée</h1>
          </div>

          <div className="sp-card__body">
            {!cvFile ? (
              <>
                
                <StepUpload onSuccess={handleCvSuccess} onError={setCvError} />
                {cvError && (
                  <p className="sp-error-msg" role="alert" aria-live="assertive">
                    <i className="fas fa-exclamation-circle" aria-hidden="true" /> {cvError}
                  </p>
                )}
              </>
            ) : (
              <CandidatureForm cvFile={cvFile} prefill={prefill} onReset={handleReset} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}