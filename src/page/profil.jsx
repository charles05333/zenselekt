import { useState, useEffect, useRef } from "react";
import Menu from "./Menu";
import { useSessionGuard } from "../auth/useSessionGuard.jsx";
import Swal from "sweetalert2";
import "./css/dashboard.css";
import "./css/profil.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost/backoffice";

const LAYOUT_STYLE = `
  .pf-row {
    display: grid !important;
    grid-template-columns: minmax(0,1fr) minmax(0,1fr) !important;
    gap: 20px;
    align-items: start;
    width: 100%;
    box-sizing: border-box;
  }
  .pf-row.pf-row--3 {
    grid-template-columns: minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) !important;
  }
  .pf-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }
  .pf-section {
    min-width: 0;
  }
  @media (max-width: 1100px) {
    .pf-row.pf-row--3 {
      grid-template-columns: minmax(0,1fr) minmax(0,1fr) !important;
    }
  }
  @media (max-width: 900px) {
    .pf-row,
    .pf-row.pf-row--3 {
      grid-template-columns: 1fr !important;
    }
    .pf-grid {
      grid-template-columns: 1fr !important;
    }
  }
  @media (max-width: 640px) {
    .pf-row,
    .pf-row.pf-row--3 {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }
    .pf-grid {
      grid-template-columns: 1fr !important;
    }
    .pf-section {
      padding: 16px !important;
    }
  }
`;

const COUNTRIES = [
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

const COMMUNES = [
  "Abobo","Adjamé","Attécoubé","Cocody","Koumassi",
  "Marcory","Plateau","Port-Bouët","Treichville","Yopougon",
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

// ─── Icônes ───────────────────────────────────────────────────────────────────
function Icon({ name }) {
  const s = { fill: "none", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "upload") return (
    <svg viewBox="0 0 24 24" style={s}>
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
  if (name === "check") return (
    <svg viewBox="0 0 24 24" style={s}><polyline points="20 6 9 17 4 12"/></svg>
  );
  if (name === "x") return (
    <svg viewBox="0 0 24 24" style={s}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
  if (name === "eye") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
  if (name === "eye-off") return (
    <svg viewBox="0 0 24 24" style={s}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
  return null;
}

// ─── Champ upload fichier — expose le fichier via ref ─────────────────────────
const FileUploadField = ({ label, id, accept, acceptLabel, existingName, fileRef }) => {
  const [file, setFile]   = useState(null);
  const [error, setError] = useState("");
  const inputRef          = useRef(null);

  // Synchronise le ref parent avec le fichier sélectionné
  useEffect(() => {
    if (fileRef) fileRef.current = file;
  }, [file, fileRef]);

  const allowedMap = {
    cv:      ["pdf"],
    diplome: ["pdf", "png", "jpeg", "jpg"],
    lettre:  ["pdf", "doc", "docx"],
  };

  const existingExt = existingName ? existingName.split(".").pop().toUpperCase() : "";

  function handleChange(e) {
    const f = e.target.files[0];
    setError(""); setFile(null);
    if (!f) return;
    const ext     = f.name.split(".").pop().toLowerCase();
    const allowed = allowedMap[id] || [];
    if (!allowed.includes(ext))     { setError("Format non autorisé"); return; }
    if (f.size > 10 * 1024 * 1024) { setError("Fichier trop volumineux (max 10 Mo)"); return; }
    setFile(f);
  }

  function handleClearNew() {
    setFile(null);
    if (fileRef) fileRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="pf-file-group">
      <label className="pf-label">{label}</label>

      {/* Fichier existant — compact, une seule ligne, SANS lien cliquable */}
      {existingName && !file && (
        <div className="pf-file-row">
          <span className="pf-file-row__ext">{existingExt}</span>
          <span className="pf-file-row__name" title={existingName}>
            {existingName}
          </span>
          <button
            type="button"
            className="pf-file-row__btn"
            onClick={() => inputRef.current?.click()}
          >
            Remplacer
          </button>
        </div>
      )}

      {/* Zone de dépôt (si pas de fichier existant OU nouveau fichier sélectionné) */}
      {(!existingName || file) && (
        <div
          className={`pf-file-zone${file ? " pf-file-zone--filled" : ""}`}
          onClick={() => !file && inputRef.current?.click()}
          style={{ cursor: file ? "default" : "pointer" }}
        >
          <span className="pf-file-icon"><Icon name="upload" /></span>
          <span className="pf-file-hint">
            {file ? file.name : `Choisir un fichier — ${acceptLabel}`}
          </span>
        </div>
      )}

      {/* Input caché */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
      />

      {error && <span className="pf-file-error">{error}</span>}

      {/* Nouveau fichier sélectionné */}
      {file && (
        <div className="pf-file-ok">
          <span className="pf-file-ok-ico"><Icon name="check" /></span>
          <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {file.name}
          </span>
          <button type="button" className="pf-file-clear" onClick={handleClearNew} title="Annuler">
            <Icon name="x" />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Valeur initiale formulaire ───────────────────────────────────────────────
const EMPTY_FORM = {
  nom: "", prenoms: "", email: "", tel: "", telwhat: "",
  Secteur: "", date_N: "", Niveau: "", Genre: "",
  Lieu_N: "", Pays_N: "", Pays_R: "",
  Situation_M: "", Nombre_E: 0, Niveau_A: "",
  Commune: "", Quartier: "", Ref_A: "", Ref_P: "",
  // Noms de fichiers existants (affichage uniquement)
  Fichier_cv_name: "", Fichiers_D_name: "", Lettre_M_name: "",
  mdp: "", mdpConfirm: "",
};

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Profil() {

  const { session, loading, logout } = useSessionGuard({
    redirectTo:    "/connexion",
    checkInterval: 5 * 60 * 1000,
  });

  const [showLogout, setShowLogout] = useState(false);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [loadingProfil, setLoadingProfil] = useState(false);
  const [errorProfil,   setErrorProfil]   = useState("");
  const [showMdp,       setShowMdp]       = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});

  // Refs vers les fichiers sélectionnés dans chaque FileUploadField
  const cvFileRef     = useRef(null);
  const diplomeFileRef = useRef(null);
  const lettreFileRef  = useRef(null);

  // ── Chargement du profil ──────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !session || !session.email) return;

    const token = localStorage.getItem("token") || "";
    if (!token) return;

    setLoadingProfil(true);
    setErrorProfil("");

    fetch(`${API_BASE}/profil`, {
      method:      "GET",
      credentials: "include",
      headers: {
        Accept:        "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (res.status === 401) {
          setErrorProfil("Session expirée. Veuillez vous reconnecter.");
          return null;
        }
        if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
        return res.json();
      })
      .then(data => {
        if (!data) return;
        const p = data.profil ?? data;

        // Extraire uniquement le nom du fichier (pas le chemin complet)
        const basename = (path) => path ? path.split("/").pop() : "";

        setForm({
          nom:         p.nom         ?? "",
          prenoms:     p.prenoms     ?? "",
          email:       p.email       ?? "",
          tel:         p.tel         ?? "",
          telwhat:     p.telwhat     ?? "",
          Secteur:     p.Secteur     ?? "",
          date_N:      p.date_N      ?? "",
          Niveau:      p.Niveau      ?? "",
          Genre:       p.Genre       ?? "",
          Lieu_N:      p.Lieu_N      ?? "",
          Pays_N:      p.Pays_N      ?? "",
          Pays_R:      p.Pays_R      ?? "",
          Situation_M: p.Situation_M ?? "",
          Nombre_E:    p.Nombre_E    ?? 0,
          Niveau_A:    p.Niveau_A    ?? "",
          Commune:     p.Commune     ?? "",
          Quartier:    p.Quartier    ?? "",
          Ref_A:       p.Ref_A       ?? "",
          Ref_P:       p.Ref_P       ?? "",
          // Noms de fichiers pour affichage (sans lien)
          Fichier_cv_name:  basename(p.Fichier_cv  ?? ""),
          Fichiers_D_name:  basename(p.Fichiers_D  ?? ""),
          Lettre_M_name:    basename(p.Lettre_M    ?? ""),
          mdp:         "",
          mdpConfirm:  "",
        });
      })
      .catch(() => {
        setErrorProfil("Impossible de charger le profil. Vérifiez votre connexion.");
      })
      .finally(() => {
        setLoadingProfil(false);
      });
  }, [loading, session]);

  // ── Handlers formulaire ───────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.email) errs.email = "L'email est requis.";
    if (!form.tel)   errs.tel   = "Le téléphone est requis.";
    if (form.mdp && form.mdp.length < 7)          errs.mdp        = "Minimum 7 caractères.";
    if (form.mdp && form.mdp !== form.mdpConfirm) errs.mdpConfirm = "Les mots de passe ne correspondent pas.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setErrors({});

    try {
      const token = localStorage.getItem("token") || "";

      // ── Construire un FormData (multipart) pour envoyer aussi les fichiers ──
      const fd = new FormData();

      // Champs texte
      const textFields = [
        "email","tel","telwhat","Secteur","date_N","Niveau","Genre",
        "Lieu_N","Pays_N","Pays_R","Situation_M","Nombre_E","Niveau_A",
        "Commune","Quartier","Ref_A","Ref_P",
      ];
      textFields.forEach(f => fd.append(f, form[f] ?? ""));

      // Mot de passe (uniquement s'il est renseigné)
      if (form.mdp) {
        fd.append("mdp", form.mdp);
        fd.append("mdpConfirm", form.mdpConfirm);
      }

      // Fichiers (uniquement si l'utilisateur en a sélectionné un nouveau)
      if (cvFileRef.current)      fd.append("Fichier_cv",  cvFileRef.current);
      if (diplomeFileRef.current) fd.append("Fichiers_D",  diplomeFileRef.current);
      if (lettreFileRef.current)  fd.append("Lettre_M",    lettreFileRef.current);

      const res = await fetch(`${API_BASE}/profil`, {
        method:      "POST",   // POST avec _method=PUT pour PHP qui ne lit pas PUT multipart
        credentials: "include",
        headers: {
          Accept:        "application/json",
          Authorization: `Bearer ${token}`,
          // PAS de Content-Type : le navigateur le pose automatiquement avec le boundary
        },
        body: fd,
      });

      if (res.status === 401) { logout(); return; }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Erreur serveur (${res.status})`);
      }

      await Swal.fire({
        icon:              "success",
        title:             "Modifications enregistrées !",
        text:              "Votre profil a été mis à jour avec succès.",
        confirmButtonText: "OK",
        confirmButtonColor: "#0d6e5e",
        timer:             3000,
        timerProgressBar:  true,
      });

    } catch (err) {
      await Swal.fire({
        icon:              "error",
        title:             "Erreur",
        text:              err.message || "Une erreur est survenue. Veuillez réessayer.",
        confirmButtonText: "Fermer",
        confirmButtonColor: "#e53935",
      });
    } finally {
      setSaving(false);
    }
  }

  // ── Chargement session ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh" }}>
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
        <style>{LAYOUT_STYLE}</style>

        <div className="db-greeting">
          <h2>Mon profil</h2>
          <p>Mettez à jour vos informations personnelles</p>
        </div>

        {loadingProfil ? (
          <div className="db-loading" role="status" aria-live="polite">
            <div className="ins-spinner" aria-hidden="true" />
            <p>Chargement du profil…</p>
          </div>
        ) : errorProfil ? (
          <div className="db-error" role="alert">
            <i className="fas fa-exclamation-circle" aria-hidden="true" /> {errorProfil}
          </div>
        ) : (
          <>
            {errors._global && (
              <div className="db-error" role="alert">{errors._global}</div>
            )}

            <form className="pf-form" onSubmit={handleSubmit}>

              {/* ── Rangée 1 : Identité + Localisation ── */}
              <div className="pf-row">

                {/* Identité */}
                <div className="pf-section">
                  <h3 className="pf-section-title">Identité</h3>
                  <div className="pf-grid">

                    <div className="pf-group">
                      <label className="pf-label">Nom(s)</label>
                      <input className="pf-input pf-input--readonly" type="text" name="nom" value={form.nom} readOnly />
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Prénom(s)</label>
                      <input className="pf-input pf-input--readonly" type="text" name="prenoms" value={form.prenoms} readOnly />
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Email *</label>
                      <input
                        className={`pf-input${errors.email ? " pf-input--error" : ""}`}
                        type="email" name="email" value={form.email} onChange={handleChange}
                      />
                      {errors.email && <span className="pf-error">{errors.email}</span>}
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Téléphone *</label>
                      <input
                        className={`pf-input${errors.tel ? " pf-input--error" : ""}`}
                        type="text" name="tel" value={form.tel} onChange={handleChange}
                      />
                      {errors.tel && <span className="pf-error">{errors.tel}</span>}
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Téléphone WhatsApp</label>
                      <input className="pf-input" type="text" name="telwhat" value={form.telwhat} onChange={handleChange} />
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Date de naissance</label>
                      <input className="pf-input" type="date" name="date_N" value={form.date_N} onChange={handleChange} />
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Genre</label>
                      <select className="pf-input" name="Genre" value={form.Genre} onChange={handleChange}>
                        <option value="">Sélectionner</option>
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                      </select>
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Lieu de naissance</label>
                      <input className="pf-input" type="text" name="Lieu_N" value={form.Lieu_N} onChange={handleChange} />
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Situation matrimoniale</label>
                      <select className="pf-input" name="Situation_M" value={form.Situation_M} onChange={handleChange}>
                        <option value="">Sélectionner</option>
                        <option value="marie(e)">Marié(e)</option>
                        <option value="pacse(e)">Pacsé(e)</option>
                        <option value="celibataire">Célibataire</option>
                        <option value="veuf(ve)">Veuf(ve)</option>
                      </select>
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Nombre d'enfants</label>
                      <input className="pf-input" type="number" name="Nombre_E" value={form.Nombre_E} min="0" onChange={handleChange} />
                    </div>

                  </div>
                </div>

                {/* Localisation + Formation */}
                <div className="pf-section">
                  <h3 className="pf-section-title">Localisation</h3>
                  <div className="pf-grid">

                    <div className="pf-group">
                      <label className="pf-label">Pays de nationalité</label>
                      <select className="pf-input" name="Pays_N" value={form.Pays_N} onChange={handleChange}>
                        <option value="">Sélectionner</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Pays de résidence</label>
                      <select className="pf-input" name="Pays_R" value={form.Pays_R} onChange={handleChange}>
                        <option value="">Sélectionner</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Commune</label>
                      <select className="pf-input" name="Commune" value={form.Commune} onChange={handleChange}>
                        <option value="">Choisir une commune</option>
                        {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Quartier</label>
                      <input
                        className="pf-input" type="text" name="Quartier" value={form.Quartier}
                        onChange={handleChange} placeholder="Ex : Angré, Riviera..."
                      />
                    </div>

                  </div>

                  <h3 className="pf-section-title" style={{ marginTop: "24px" }}>Formation & Compétences</h3>
                  <div className="pf-grid">

                    <div className="pf-group">
                      <label className="pf-label">Secteur d'activité</label>
                      <select className="pf-input" name="Secteur" value={form.Secteur} onChange={handleChange}>
                        <option value="">Sélectionner</option>
                        {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Niveau académique</label>
                      <select className="pf-input" name="Niveau" value={form.Niveau} onChange={handleChange}>
                        <option value="">Sélectionner</option>
                        <option value="certificat">Certificat</option>
                        <option value="bac">Bac</option>
                        <option value="bts">BTS</option>
                        <option value="licence">Licence</option>
                        <option value="ingenieur">Ingénieur</option>
                        <option value="master">Master</option>
                        <option value="doctorat">Doctorat</option>
                      </select>
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Niveau d'anglais</label>
                      <select className="pf-input" name="Niveau_A" value={form.Niveau_A} onChange={handleChange}>
                        <option value="">Sélectionner</option>
                        <option value="faible">Faible</option>
                        <option value="moyen">Moyen</option>
                        <option value="courant">Courant</option>
                        <option value="bilingue">Bilingue</option>
                      </select>
                    </div>

                  </div>
                </div>

              </div>{/* fin rangée 1 */}

              {/* ── Rangée 2 : Sécurité + Documents + Références ── */}
              <div className="pf-row pf-row--3">

                {/* Sécurité */}
                <div className="pf-section">
                  <h3 className="pf-section-title">Sécurité</h3>
                  <div className="pf-grid">

                    <div className="pf-group">
                      <label className="pf-label" style={{ minHeight: "36px", display: "flex", alignItems: "flex-end", flexWrap: "wrap" }}>
                        Nouveau mot de passe&nbsp;
                        <span className="pf-optional">(laisser vide pour conserver)</span>
                      </label>
                      <div className="pf-pwd-wrapper">
                        <input
                          className={`pf-input${errors.mdp ? " pf-input--error" : ""}`}
                          type={showMdp ? "text" : "password"}
                          name="mdp" value={form.mdp} onChange={handleChange}
                          placeholder="7 caractères minimum"
                        />
                        <button type="button" className="pf-pwd-toggle" onClick={() => setShowMdp(v => !v)}>
                          <Icon name={showMdp ? "eye-off" : "eye"} />
                        </button>
                      </div>
                      {errors.mdp && <span className="pf-error">{errors.mdp}</span>}
                    </div>

                    <div className="pf-group">
                      <label className="pf-label" style={{ minHeight: "36px", display: "flex", alignItems: "flex-end" }}>
                        Confirmer le mot de passe
                      </label>
                      <div className="pf-pwd-wrapper">
                        <input
                          className={`pf-input${errors.mdpConfirm ? " pf-input--error" : ""}`}
                          type={showConfirm ? "text" : "password"}
                          name="mdpConfirm" value={form.mdpConfirm} onChange={handleChange}
                          placeholder="Confirmez"
                        />
                        <button type="button" className="pf-pwd-toggle" onClick={() => setShowConfirm(v => !v)}>
                          <Icon name={showConfirm ? "eye-off" : "eye"} />
                        </button>
                      </div>
                      {errors.mdpConfirm && <span className="pf-error">{errors.mdpConfirm}</span>}
                    </div>

                  </div>
                </div>

                {/* Documents */}
                <div className="pf-section">
                  <h3 className="pf-section-title">Documents</h3>
                  <div className="pf-grid pf-grid--docs">
                    <FileUploadField
                      label="CV (PDF)"
                      id="cv"
                      accept=".pdf"
                      acceptLabel="PDF uniquement"
                      existingName={form.Fichier_cv_name}
                      fileRef={cvFileRef}
                    />
                    <FileUploadField
                      label="Diplômes (PDF, PNG, JPEG)"
                      id="diplome"
                      accept=".pdf,.png,.jpeg,.jpg"
                      acceptLabel="PDF, PNG, JPEG"
                      existingName={form.Fichiers_D_name}
                      fileRef={diplomeFileRef}
                    />
                    <FileUploadField
                      label="Lettre de motivation (PDF, Word)"
                      id="lettre"
                      accept=".pdf,.doc,.docx"
                      acceptLabel="PDF, DOC, DOCX"
                      existingName={form.Lettre_M_name}
                      fileRef={lettreFileRef}
                    />
                  </div>
                </div>

                {/* Références */}
                <div className="pf-section">
                  <h3 className="pf-section-title">Références</h3>
                  <div className="pf-grid pf-grid--single">

                    <div className="pf-group">
                      <label className="pf-label">Références académiques</label>
                      <textarea
                        className="pf-input pf-textarea" name="Ref_A" value={form.Ref_A}
                        onChange={handleChange} rows="4"
                        placeholder="Nom, poste, institution, contact..."
                      />
                    </div>

                    <div className="pf-group">
                      <label className="pf-label">Références professionnelles</label>
                      <textarea
                        className="pf-input pf-textarea" name="Ref_P" value={form.Ref_P}
                        onChange={handleChange} rows="4"
                        placeholder="Nom, poste, entreprise, contact..."
                      />
                    </div>

                  </div>
                </div>

              </div>{/* fin rangée 2 */}

              {/* ── Submit ── */}
              <div className="pf-submit-row">
                <button type="submit" className="pf-btn-submit" disabled={saving}>
                  {saving
                    ? <><span className="pf-btn-spinner" /> Enregistrement…</>
                    : "Enregistrer les modifications"
                  }
                </button>
              </div>

            </form>
          </>
        )}

      </Menu>
    </>
  );
}