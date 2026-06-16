import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import App from "./App.jsx";
import Connexion from "./auth/connexion.jsx";
import Inscription from "./auth/inscription.jsx";
import ResetPassword from "./auth/resetpassword.jsx";
import InscriptionSpontanee from "./auth/inscription-spontanee.jsx";
import Mdpoublie from "./auth/mdpoublie.jsx";
import Menu from "./page/Menu.jsx";
import Jobs from "./page/Jobs.jsx";
import JobsID from "./page/JobsID.jsx";
import Dashboard from "./page/Dashboard.jsx"; 
import JobsAuth from "./page/JobsAuth.jsx"; 
import JobsAuthID from "./page/JobsAuthID.jsx";
import Profil from "./page/Profil.jsx";
import NotFound from "./page/NotFound.jsx";
import Candidatures from "./page/Candidatures.jsx";// ← ajouté
import Pression from "./page/tests/pression.jsx";
import MBTI from "./page/tests/mbti.jsx";
import DOMINO from "./page/tests/domino.jsx";
import Bigfive from "./page/tests/bigfive.jsx";
import Anglais from "./page/tests/anglais.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/inscription-spontanee" element={<InscriptionSpontanee />} />
        <Route path="/mdpoublie" element={<Mdpoublie />} />
        <Route path="/Menu" element={<Menu />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobsID />} />
        <Route path="/dashbord" element={<Dashboard />} />  {/* ← ajouté */}
        <Route path="/jobs-auth" element={<JobsAuth />} />  {/* ← ajouté */}
        <Route path="/jobs-auth/:id" element={<JobsAuthID />} />  {/* ← ajouté */}
        <Route path="/profil" element={<Profil />} />  {/* ← ajouté */}
        <Route path="/candidatures" element={<Candidatures />} />  {/* ← ajouté */}
        <Route path="/resetpassword" element={<ResetPassword />} />  {/* ← ajouté */}
        <Route path="*" element={<NotFound />} />  {/* ← ajouté */}
        <Route path="/tests/pression" element={<Pression />} />  {/* ← ajouté */}
        <Route path="/tests/mbti" element={<MBTI />} />  {/* ← ajouté */}
        <Route path="/tests/domino" element={<DOMINO />} />  {/* ← ajouté */}
        <Route path="/tests/bigfive" element={<Bigfive />} />  {/* ← ajouté */}
        <Route path="/tests/anglais" element={<Anglais />} />  {/* ← ajouté */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);