import { useState } from "react";
import Swal from "sweetalert2";
import "./css/Connexion.css";
import "./css/MdpOublie.css";
import zenImg from "../assets/img/zen.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost/backoffice";

export default function MdpOublie() {
    const [email,  setEmail]  = useState("");
    const [statut, setStatut] = useState("idle"); // idle | loading

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Champ requis",
                text: "Veuillez entrer votre adresse e-mail.",
                confirmButtonColor: "#5DABA8",
                confirmButtonText: "OK",
            });
            return;
        }

        setStatut("loading");

        try {
            const res  = await fetch(`${API_BASE}/mdpoublie`, {
                method:  "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body:    JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            const data = await res.json();

            if (res.status === 429) {
                Swal.fire({
                    icon: "warning",
                    title: "Trop de tentatives",
                    text: data.message || "Veuillez patienter avant de réessayer.",
                    confirmButtonColor: "#5DABA8",
                });
                setStatut("idle");
                return;
            }

            // Que le compte existe ou non, on affiche toujours le même message
            // (sécurité : ne pas révéler l'existence du compte)
            showSuccess(email.trim());

        } catch {
            Swal.fire({
                icon: "error",
                title: "Serveur inaccessible",
                text: "Impossible de contacter le serveur. Réessayez plus tard.",
                confirmButtonColor: "#5DABA8",
                confirmButtonText: "OK",
            });
            setStatut("idle");
        }
    };

    const showSuccess = (emailEnvoye) => {
        Swal.fire({
            icon: "success",
            title: "E-mail envoyé !",
            html: `
                Si un compte est associé à <strong>${emailEnvoye}</strong>, vous recevrez
                dans quelques instants un e-mail contenant un lien de réinitialisation.
                <br><br>
                <small style="color:#718096;">
                    Vérifiez également vos courriers indésirables (spam) si vous ne trouvez pas l'e-mail.
                    Le lien est valable <strong>1 heure</strong>.
                </small>
            `,
            confirmButtonColor: "#5DABA8",
            confirmButtonText: "Retour à la connexion",
            allowOutsideClick: false,
        }).then((result) => {
            if (result.isConfirmed) window.location.href = "/connexion";
        });
    };

    return (
        <div className="cx-page">
            <div className="cx-topbar">
                <a href="/connexion" className="cx-topbar__back">← Connexion</a>
                <div className="cx-topbar__logo">
                    <img src={zenImg} alt="Zenselekt" />
                </div>
            </div>

            <div className="cx-card">
                <h2 className="cx-card__title">Mot de passe oublié</h2>

                <p className="mdp-desc">
                    Entrez l'adresse e-mail associée à votre compte. Nous vous enverrons
                    un lien pour réinitialiser votre mot de passe.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                    <input
                        type="email"
                        className="cx-input"
                        placeholder="Votre adresse e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={statut === "loading"}
                        aria-label="Adresse e-mail"
                    />

                    <button
                        type="submit"
                        className="cx-btn"
                        disabled={statut === "loading"}
                        aria-busy={statut === "loading"}
                    >
                        {statut === "loading" ? "Envoi en cours…" : "Envoyer le lien"}
                    </button>
                </form>

                <div className="cx-links">
                    <a href="/connexion">Se connecter</a>
                    {" | "}
                    <a href="/inscription"><strong>Créer un compte</strong></a>
                </div>
            </div>
        </div>
    );
}