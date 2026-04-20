import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import App from "./App.jsx";
import Connexion from "./auth/connexion.jsx";
import Inscription from "./auth/inscription.jsx";
import InscriptionSpontanee from "./auth/inscription-spontanee.jsx";
import Jobs from "./page/Jobs.jsx";
import JobsID from "./page/JobsID.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/inscription-spontanee" element={<InscriptionSpontanee />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobsID />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);