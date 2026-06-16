import { useState, useEffect, useRef, useCallback } from "react";
import './css/domino.css';
import Swal from "sweetalert2";
import loImg from "./images/logo_empower.png";

const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

const SERIES = [
  {
    title: "Série 1",
    question: [[1,3], [5,4], [5,6]],
    answer: [5,4],
    options: [[1,2], [4,4], [1,1], [5,4]],
  },
  {
    title: "Série 2",
    question: [[3,3], [2,1], [4,2]],
    answer: [5,4],
    options: [[5,4], [3,3], [2,2], [1,5]],
  },
  {
    title: "Série 3",
    question: [[1,2], [3,1], [5,0]],
    answer: [0,2],
    options: [[0,2], [2,3], [4,1], [1,1]],
  },
  {
    title: "Série 4",
    question: [[2,3], [1,2], [2,6]],
    answer: [1,4],
    options: [[1,4], [3,2], [2,5], [4,1]],
  },
  {
    title: "Série 5",
    question: [[4,2], [2,3], [5,4]],
    answer: [6,5],
    options: [[6,5], [4,3], [3,4], [5,2]],
  },
  {
    title: "Série 6",
    question: [[2,3], [3,2], [4,1]],
    answer: [1,4],
    options: [[1,4], [5,0], [3,3], [2,2]],
  },
  {
    title: "Série 7",
    question: [[1,2], [3,4], [5,6]],
    answer: [3,4],
    options: [[3,4], [1,2], [6,5], [4,3]],
  },
  {
    title: "Série 8",
    question: [[0,1], [1,0], [2,6]],
    answer: [3,5],
    options: [[3,5], [2,4], [4,6], [1,3]],
  },
  {
    title: "Série 9",
    question: [[6,1], [5,2], [4,3]],
    answer: [4,3],
    options: [[4,3], [3,4], [2,5], [1,6]],
  },
  {
    title: "Série 10",
    question: [[6,6], [3,3], [0,0]],
    answer: [3,3],
    options: [[3,3], [4,4], [2,2], [5,5]],
  }
];

const TOTAL_SERIES = SERIES.length;
const TIMER_SECONDS = 600; // 10 minutes

// ── Domino dot positions ─────────────────────────────────
const DOT_POSITIONS = {
  0: [],
  1: [[50, 50]],
  2: [[30, 28], [70, 72]],
  3: [[30, 22], [50, 50], [70, 78]],
  4: [[28, 26], [72, 26], [28, 74], [72, 74]],
  5: [[28, 22], [72, 22], [50, 50], [28, 78], [72, 78]],
  6: [[28, 18], [72, 18], [28, 50], [72, 50], [28, 82], [72, 82]],
};

function DominoDots({ count }) {
  const positions = DOT_POSITIONS[count] || [];
  return (
    <div className="dn-dots-field">
      {positions.map(([left, top], i) => (
        <span key={i} className="dn-dot" style={{ left: `${left}%`, top: `${top}%` }} />
      ))}
    </div>
  );
}

function DominoPiece({ top, bottom, isQuestion = false, isSelected = false, isOption = false, onClick }) {
  return (
    <div
      className={[
        "dn-domino",
        isOption ? "dn-domino--option" : "",
        isSelected ? "dn-domino--selected" : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      <div className="dn-half">
        {isQuestion ? (
          <span className="dn-question-mark">?</span>
        ) : (
          <DominoDots count={top} />
        )}
      </div>
      <div className="dn-divider" />
      <div className="dn-half">
        {isQuestion ? (
          <span className="dn-question-mark">?</span>
        ) : (
          <DominoDots count={bottom} />
        )}
      </div>
    </div>
  );
}

function TimerDisplay({ seconds }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 60;
  return (
    <div className={`dn-timer ${isUrgent ? "dn-timer--urgent" : ""}`}>
      <i className="bi bi-clock"></i>
      <span>{mins}:{secs.toString().padStart(2, "0")}</span>
      <span className="dn-timer-label">minutes restantes</span>
    </div>
  );
}

function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="dn-progress-wrap">
      <div className="dn-progress-info">
        <span><strong>{current}</strong> / {total} séries</span>
        <span className="dn-progress-pct">{pct}%</span>
      </div>
      <div className="dn-progress-track">
        <div className="dn-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SuccessScreen({ prenom, genre }) {
  const civilite = genre === "M" ? "M." : genre === "F" ? "Mme" : "";
  return (
    <div className="dn-success">
      <div className="dn-success-icon">
        <i className="bi bi-check-circle-fill" />
      </div>
      <h2>Test soumis avec succès</h2>
      <p>Merci {[civilite, prenom].filter(Boolean).join(" ") || "!"}</p>
      <span>Vos résultats ont été enregistrés et seront analysés par notre équipe.</span>
    </div>
  );
}

function AlreadyTakenScreen() {
  return (
    <div className="dn-success">
      <div className="dn-success-icon dn-success-icon--info">
        <i className="bi bi-info-circle-fill" />
      </div>
      <h2>Test déjà complété</h2>
      <p>Vous avez déjà passé ce test.</p>
      <span>Vous ne pouvez passer ce test qu'une seule fois.</span>
    </div>
  );
}

export default function Domino() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = BI_CDN;
      document.head.appendChild(link);
    }
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const initPrenom = urlParams.get("prenoms")  || sessionStorage.getItem("dn_prenom") || "";
  const initNom    = urlParams.get("nom")      || sessionStorage.getItem("dn_nom")    || "";
  const initEmail  = urlParams.get("email")    || sessionStorage.getItem("dn_email")  || "";
  const initGenre  = urlParams.get("genre")    || sessionStorage.getItem("dn_genre")  || "";
  const initPoste  = urlParams.get("poste")    || sessionStorage.getItem("dn_poste")  || "";
  const offreId    = urlParams.get("offre_id") || sessionStorage.getItem("dn_offre")  || "";

  const prenomFromUrl = Boolean(urlParams.get("prenoms"));
  const nomFromUrl    = Boolean(urlParams.get("nom"));
  const emailFromUrl  = Boolean(urlParams.get("email"));
  const genreFromUrl  = Boolean(urlParams.get("genre"));

  // Sauvegarder en sessionStorage et nettoyer l'URL
  if (urlParams.has("email")) {
    sessionStorage.setItem("dn_prenom", initPrenom);
    sessionStorage.setItem("dn_nom",    initNom);
    sessionStorage.setItem("dn_email",  initEmail);
    sessionStorage.setItem("dn_genre",  initGenre);
    sessionStorage.setItem("dn_poste",  initPoste);
    sessionStorage.setItem("dn_offre",  offreId);
    window.history.replaceState({}, "", window.location.pathname);
  }

  const [prenom, setPrenom] = useState(initPrenom);
  const [nom, setNom]       = useState(initNom);
  const [email, setEmail]   = useState(initEmail);
  const [genre, setGenre]   = useState(initGenre);

  const [phase, setPhase]               = useState("identity");
  const [currentSeries, setCurrentSeries] = useState(0);
  const [userAnswers, setUserAnswers]   = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted]       = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [alreadyDate, setAlreadyDate]   = useState("");
  const [timeLeft, setTimeLeft]         = useState(TIMER_SECONDS);
  const [loading, setLoading]           = useState(false);

  const startTimeRef  = useRef(null);
  const timerRef      = useRef(null);

  // Vérifier si test déjà passé
  useEffect(() => {
    if (!initEmail) return;
    fetch("/backoffice/check_test_taken_Domino.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: initEmail, offre_id: offreId || null }),
    })
      .then((r) => r.json())
      .then((result) => { 
        if (result.already_taken) {
          setAlreadyTaken(true);
          setAlreadyDate(result.date_passage || "");
          sessionStorage.removeItem("dn_prenom");
          sessionStorage.removeItem("dn_nom");
          sessionStorage.removeItem("dn_email");
          sessionStorage.removeItem("dn_genre");
          sessionStorage.removeItem("dn_poste");
          sessionStorage.removeItem("dn_offre");
        }
      })
      .catch(() => {});
  }, [initEmail, offreId]);

  // Empêcher retour arrière
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      if (!submitted) window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [submitted]);

  // Timer
  useEffect(() => {
    if (phase !== "test") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  async function saveResults(answers) {
    setLoading(true);
    const endTime = new Date();
    const timeSpent = Math.floor((endTime - startTimeRef.current) / 1000);

    let correct = 0, incorrect = 0, unanswered = 0;
    SERIES.forEach((serie, i) => {
      const ans = answers[i];
      if (ans) {
        if (ans[0] === serie.answer[0] && ans[1] === serie.answer[1]) correct++;
        else incorrect++;
      } else {
        unanswered++;
      }
    });

    const score = correct * 2;

    const data = {
      prenom,
      nom,
      email,
      genre,
      titrePoste: initPoste,
      offreId: offreId || null,
      results: { correct, incorrect, unanswered, score },
      answers: Object.values(answers),
      startTime: startTimeRef.current.toISOString(),
      timeSpent,
    };

    try {
      const response = await fetch("/backoffice/save_test_results_domino.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (result.success) {
        sessionStorage.removeItem("dn_prenom");
        sessionStorage.removeItem("dn_nom");
        sessionStorage.removeItem("dn_email");
        sessionStorage.removeItem("dn_genre");
        sessionStorage.removeItem("dn_poste");
        sessionStorage.removeItem("dn_offre");
        setSubmitted(true);
        setPhase("submitted");
      } else if (result.error_code === "TEST_ALREADY_TAKEN") {
        Swal.fire({
          icon: "info",
          title: "Test déjà passé",
          text: result.message,
          confirmButtonColor: "#6C0277",
        });
      } else {
        throw new Error(result.message || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de sauvegarder les résultats.",
        confirmButtonColor: "#6C0277",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTest() {
    if (!genre) {
      Swal.fire({
        icon: "error",
        title: "Champ requis",
        text: "Veuillez sélectionner votre genre.",
        confirmButtonColor: "#6C0277",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "info",
      title: "Prêt à commencer ?",
      html: "<p>Vous avez <strong>10 minutes</strong> pour compléter les 10 séries de dominos.</p><p>Identifiez le domino manquant dans chaque série.</p>",
      showCancelButton: true,
      confirmButtonText: "Commencer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#6C0277",
    });

    if (result.isConfirmed) {
      startTimeRef.current = new Date();
      setPhase("test");
      setCurrentSeries(0);
      const existingAnswer = userAnswers[0];
      if (existingAnswer) {
        const optionIndex = SERIES[0].options.findIndex(
          (opt) => opt[0] === existingAnswer[0] && opt[1] === existingAnswer[1]
        );
        setSelectedOption(optionIndex !== -1 ? optionIndex : null);
      } else {
        setSelectedOption(null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSelectOption(index, value) {
    setSelectedOption(index);
    setUserAnswers((prev) => ({ ...prev, [currentSeries]: value }));
  }

  async function handleNext() {
    const next = currentSeries + 1;
    if (next < TOTAL_SERIES) {
      setCurrentSeries(next);
      const existingAnswer = userAnswers[next];
      if (existingAnswer) {
        const optionIndex = SERIES[next].options.findIndex(
          (opt) => opt[0] === existingAnswer[0] && opt[1] === existingAnswer[1]
        );
        setSelectedOption(optionIndex !== -1 ? optionIndex : null);
      } else {
        setSelectedOption(null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      clearInterval(timerRef.current);
      await saveResults(userAnswers);
    }
  }

  function handlePrevious() {
    if (currentSeries > 0) {
      const prev = currentSeries - 1;
      setCurrentSeries(prev);
      const existingAnswer = userAnswers[prev];
      if (existingAnswer) {
        const optionIndex = SERIES[prev].options.findIndex(
          (opt) => opt[0] === existingAnswer[0] && opt[1] === existingAnswer[1]
        );
        setSelectedOption(optionIndex !== -1 ? optionIndex : null);
      } else {
        setSelectedOption(null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const isLastSeries = currentSeries === TOTAL_SERIES - 1;
  const serie = SERIES[currentSeries];

  if (alreadyTaken) {
    return (
      <div className="dn-page">
        <header className="dn-header">
          <img src={loImg} alt="Logo Empower" className="dn-logo" />
          <div className="dn-header-title">Test de raisonnement logique — Dominos</div>
        </header>
        <div className="dn-container"><AlreadyTakenScreen /></div>
      </div>
    );
  }

  if (phase === "submitted") {
    return (
      <div className="dn-page">
        <header className="dn-header">
          <img src={loImg} alt="Logo Empower" className="dn-logo" />
          <div className="dn-header-title">Test de raisonnement logique — Dominos</div>
        </header>
        <div className="dn-container"><SuccessScreen prenom={prenom} genre={genre} /></div>
      </div>
    );
  }

  return (
    <div className="dn-page">
      <header className="dn-header">
        <img src={loImg} alt="Logo Empower" className="dn-logo" />
        <div className="dn-header-title">Test de raisonnement logique — Dominos</div>
        {phase === "test" && <TimerDisplay seconds={timeLeft} />}
      </header>

      <div className="dn-container">

        {phase === "identity" && (
          <>
            <div className="dn-section-header">
              <i className="bi bi-person-badge"></i>
              <span>Identité du candidat</span>
            </div>

            <div className="dn-card dn-identity-card">
              <div className="dn-notice">
                <i className="bi bi-info-circle"></i>
                <div>
                  <span>Ce test comporte <strong>10 séries</strong> de dominos à compléter en <strong>10 minutes maximum</strong>. Pour chaque série, identifiez le domino qui complète logiquement la séquence.</span>
                </div>
              </div>

              <div className="dn-form-row">
                <div className="dn-form-group">
                  <label className="dn-label">Prénom(s)</label>
                  {prenomFromUrl
                    ? <input className="dn-input dn-input--readonly" type="text" value={prenom} readOnly />
                    : <input className="dn-input" type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom" />
                  }
                </div>
                <div className="dn-form-group">
                  <label className="dn-label">Nom de famille</label>
                  {nomFromUrl
                    ? <input className="dn-input dn-input--readonly" type="text" value={nom} readOnly />
                    : <input className="dn-input" type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" />
                  }
                </div>
              </div>

              <div className="dn-form-row">
                <div className="dn-form-group">
                  <label className="dn-label">Adresse e-mail <span className="dn-required">*</span></label>
                  {emailFromUrl
                    ? <input className="dn-input dn-input--readonly" type="email" value={email} readOnly />
                    : <input className="dn-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
                  }
                </div>
                <div className="dn-form-group">
                  <label className="dn-label">Genre <span className="dn-required">*</span></label>
                  {genreFromUrl
                    ? <input className="dn-input dn-input--readonly" type="text" value={genre === "M" ? "Masculin" : genre === "F" ? "Féminin" : genre} readOnly />
                    : (
                      <select className="dn-input dn-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                        <option value="">Sélectionnez...</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    )
                  }
                </div>
              </div>

              {initPoste && (
                <div className="dn-form-row dn-form-row--single">
                  <div className="dn-form-group">
                    <label className="dn-label">Poste concerné</label>
                    <input className="dn-input dn-input--readonly" type="text" value={initPoste} readOnly />
                  </div>
                </div>
              )}

              <div className="dn-start-wrap">
                <button className="dn-start-btn" onClick={handleStartTest}>
                  <i className="bi bi-play-circle-fill"></i> Commencer le test
                </button>
              </div>
            </div>
          </>
        )}

        {phase === "test" && (
          <>
            <div className="dn-sticky-progress">
              <ProgressBar current={currentSeries + 1} total={TOTAL_SERIES} />
            </div>

            <div className="dn-section-header">
              <i className="bi bi-grid-3x3-gap"></i>
              <span>{serie.title}</span>
            </div>

            <div className="dn-card dn-series-card">
              <p className="dn-question-label">Quelle est la suite logique ?</p>
              <div className="dn-dominos-row">
                {serie.question.map(([top, bottom], i) => (
                  <DominoPiece key={i} top={top} bottom={bottom} />
                ))}
                <DominoPiece isQuestion />
              </div>

              <div className="dn-divider-section"></div>

              <p className="dn-options-label">
                <i className="bi bi-hand-index"></i> Sélectionnez le domino manquant
              </p>
              <div className="dn-options-row">
                {serie.options.map(([top, bottom], i) => (
                  <DominoPiece
                    key={i}
                    top={top}
                    bottom={bottom}
                    isOption
                    isSelected={selectedOption === i}
                    onClick={() => handleSelectOption(i, [top, bottom])}
                  />
                ))}
              </div>
            </div>

            <div className="dn-nav-wrap">
              <div className="dn-nav-buttons">
                {currentSeries > 0 && (
                  <button className="dn-prev-btn" onClick={handlePrevious}>
                    <i className="bi bi-arrow-left-circle-fill"></i> Série précédente
                  </button>
                )}
                <button
                  className="dn-next-btn"
                  onClick={handleNext}
                  disabled={selectedOption === null || loading}
                >
                  {loading ? (
                    <><span className="dn-spinner"></span> Envoi...</>
                  ) : isLastSeries ? (
                    <><i className="bi bi-check-circle-fill"></i> Terminer le test</>
                  ) : (
                    <><i className="bi bi-arrow-right-circle-fill"></i> Série suivante</>
                  )}
                </button>
              </div>
              {selectedOption === null && !loading && (
                <span className="dn-nav-hint">
                  <i className="bi bi-info-circle"></i> Sélectionnez un domino pour continuer
                </span>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}