import { useState, useEffect } from "react";
import "./css/Connexion.css";
import zenImg from "../assets/img/zen.png";

// ─── Captcha Hook ─────────────────────────────────────────────────────────────
function useCaptcha() {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const answer = num1 + num2;

    const generate = () => {
        setNum1(Math.floor(Math.random() * 5));
        setNum2(Math.floor(Math.random() * 5));
    };

    useEffect(() => { generate(); }, []);

    return { num1, num2, answer, generate };
}

// ─── Connexion Page ───────────────────────────────────────────────────────────
export default function Connexion() {
    const [email, setEmail] = useState("");
    const [mdp, setMdp] = useState("");
    const [showMdp, setShowMdp] = useState(false);
    const [captchaInput, setCaptcha] = useState("");
    const [captchaFeedback, setFeedback] = useState("");
    const [erreur, setErreur] = useState("");

    const { num1, num2, answer, generate } = useCaptcha();

    // ── Captcha validation on blur ──
    const handleCaptchaBlur = () => {
        if (captchaInput === "") {
            setFeedback("Veuillez entrer une réponse.");
            return;
        }
        if (parseInt(captchaInput, 10) === answer) {
            setFeedback("✓");
        } else {
            setFeedback("Mauvaise réponse, essayez encore !");
            setCaptcha("");
        }
    };

    // ── Form submit ──
    const handleSubmit = (e) => {
        e.preventDefault();
        setErreur("");

        if (parseInt(captchaInput, 10) !== answer) {
            setErreur("Réponse au captcha incorrecte.");
            generate();
            setCaptcha("");
            return;
        }

        // ➡️  Remplace ce bloc par ton appel API PHP
        // Exemple :
        // fetch("/api/connexion.php", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ email, mdp }),
        // })
        //   .then(r => r.json())
        //   .then(data => {
        //     if (data.success) window.location.href = "/dashboard";
        //     else setErreur(data.message);
        //   });

        console.log("Connexion →", { email, mdp });
    };

    return (
        <div className="cx-page">
            {/* ── Top bar ── */}
            <div className="cx-topbar">
                <a href="/" className="cx-topbar__back">← Accueil</a>
                <div className="cx-topbar__logo">
                    <img src={zenImg} alt="Zenselekt" />
                </div>
            </div>

            {/* ── Card ── */}
            <div className="cx-card">
                <h2 className="cx-card__title">Se connecter à son compte</h2>

                {erreur && <p className="cx-alert cx-alert--error">{erreur}</p>}

                <form onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <input
                        type="email"
                        className="cx-input"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    {/* Mot de passe */}
                    <div className="cx-input-wrap">
                        <input
                            type={showMdp ? "text" : "password"}
                            className="cx-input"
                            placeholder="Mot de passe"
                            value={mdp}
                            onChange={(e) => setMdp(e.target.value)}
                            required
                        />
                        <span
                            className="cx-eye"
                            onClick={() => setShowMdp(!showMdp)}
                            role="button"
                            aria-label="Afficher/masquer le mot de passe"
                        >
                            {showMdp ? "🙈" : "👁️"}
                        </span>
                    </div>

                    {/* Captcha */}
                    <label className="cx-captcha-question">
                        {num1} + {num2} = ?
                    </label>
                    <input
                        type="text"
                        className="cx-input"
                        placeholder="Votre réponse"
                        value={captchaInput}
                        onChange={(e) => { setCaptcha(e.target.value); setFeedback(""); }}
                        onBlur={handleCaptchaBlur}
                        required
                    />
                    {captchaFeedback && (
                        <p className={`cx-captcha-feedback${captchaFeedback === "✓" ? " cx-captcha-feedback--ok" : ""}`}>
                            {captchaFeedback}
                        </p>
                    )}

                    <button type="submit" className="cx-btn">Valider</button>
                </form>

                <div className="cx-links">
                    <a href="/mdpoublie">Mot de passe oublié ?</a>
                    {" | "}
                    <a href="/inscription"><strong>Inscrivez-vous</strong></a>
                </div>
            </div>
        </div>
    );
}