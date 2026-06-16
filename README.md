# Zenselekt — Frontend Candidat

Application React (Vite) côté **candidat** de la plateforme de recrutement **Zenselekt**, développée par **Empower Talents & Careers**.  
URL de production : `https://app.zenselekt.com`

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack technique](#stack-technique)
3. [Structure du projet](#structure-du-projet)
4. [Installation et démarrage](#installation-et-démarrage)
5. [Variables d'environnement](#variables-denvironnement)
6. [Routes de l'application](#routes-de-lapplication)
7. [Architecture des composants](#architecture-des-composants)
8. [Authentification et session](#authentification-et-session)
9. [Endpoints backend consommés](#endpoints-backend-consommés)
10. [Points d'attention (bugs connus / pièges)](#points-dattention)
11. [Build et déploiement](#build-et-déploiement)

---

## Vue d'ensemble

L'application couvre le parcours complet d'un candidat :

- **Landing page publique** : présentation de la plateforme, KPIs live (offres actives, candidats inscrits), liste des dernières offres.
- **Espace public** : consultation des offres d'emploi, inscription, connexion, candidature spontanée, mot de passe oublié / reset.
- **Espace privé (authentifié)** : tableau de bord, profil candidat, suivi des candidatures, offres d'emploi avec score de compatibilité IA, notifications.
- **Tests psychométriques** : Pression, MBTI, Domino, Big Five, Anglais — accessibles via un lien envoyé par email depuis le backoffice entreprise.

---

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| React | ^19.2 | UI |
| React Router DOM | ^7.14 | Routage SPA |
| Vite | ^8.0 | Bundler / dev server |
| SweetAlert2 | ^11 | Modales d'alerte |
| Font Awesome 6 | CDN | Icônes |
| PHP / MySQL | (backend) | API REST — **dépôt séparé** |

Pas de Redux, pas de TypeScript, pas de CSS-in-JS. Tout le style est en CSS vanilla (fichiers `.css` par page).

---

## Structure du projet

```
app/
├── index.html                  # Entrée HTML (lang="en" — à corriger en "fr")
├── vite.config.js
├── package.json
├── .env.local                  # Dev  → VITE_API_BASE=http://localhost/backoffice
├── .env.production             # Prod → VITE_API_BASE=https://app.zenselekt.com/backoffice

├── public/
│   ├── favicon.svg
│   ├── icone.png
│   └── icons.svg
└── src/
    ├── main.jsx                # Entrée React + définition de toutes les routes
    ├── App.jsx                 # Landing page publique (Header, Hero, Features, Jobs, Footer)
    ├── assets/
    │   ├── css/index.css       # CSS global / landing
    │   └── img/                # zen.png, zena.png
    ├── auth/
    │   ├── connexion.jsx       # Formulaire de connexion → redirige vers /dashbord
    │   ├── inscription.jsx     # Inscription candidat (avec upload CV)
    │   ├── inscription-spontanee.jsx
    │   ├── mdpoublie.jsx       # Demande de reset mot de passe
    │   ├── resetpassword.jsx   # Formulaire de nouveau mot de passe (token URL)
    │   ├── useSessionGuard.jsx # Hook de protection de session (voir §Auth)
    │   ├── useCompatibility.jsx # Hook + composant <CompatibilityBadge> (score IA)
    │   └── css/                # CSS par page auth
    └── page/
        ├── Menu.jsx            # Layout shell : sidebar + topbar + cloche notifs
        ├── Dashboard.jsx       # Tableau de bord candidat
        ├── JobsAuth.jsx        # Liste offres (authentifié, avec badge compatibilité)
        ├── JobsAuthID.jsx      # Détail offre (authentifié) + bouton postuler
        ├── jobs.jsx            # Liste offres (public, sans auth)
        ├── JobsID.jsx          # Détail offre (public)
        ├── profil.jsx          # Édition profil candidat
        ├── candidatures.jsx    # Suivi des candidatures
        ├── NotFound.jsx        # Page 404
        ├── css/                # CSS par page
        └── tests/
            ├── pression.jsx    # Test de résistance à la pression
            ├── mbti.jsx        # Test MBTI
            ├── domino.jsx      # Test Domino (logique)
            ├── bigfive.jsx     # Test Big Five (personnalité)
            ├── anglais.jsx     # Test d'anglais
            ├── images/         # logo_empower.png
            └── css/            # CSS par test
```

---

## Installation et démarrage

### Prérequis

- Node.js ≥ 18
- Backend PHP tournant localement (voir dépôt `backoffice`)

### Étapes

```bash
# Cloner et installer
git clone <repo>
cd app
npm install

# Copier les variables d'env
cp .env.local .env   # ou créer manuellement (voir §Variables)

# Démarrer le dev server
npm run dev
# → http://localhost:5173
```

> En développement, le backend PHP doit tourner sur `http://localhost/backoffice`.  
> Avec XAMPP / WAMP, placer le dossier backoffice dans `htdocs/backoffice/`.

---

## Variables d'environnement

| Variable | Dev | Prod | Description |
|---|---|---|---|
| `VITE_API_BASE` | `http://localhost/backoffice` | `https://app.zenselekt.com/backoffice` | URL de base de l'API backend |

Les fichiers `.env.local` (dev) et `.env.production` (prod) sont déjà présents dans le dépôt.  
⚠️ `.env.production` contient un retour chariot Windows (`\r\n`) — vérifier si cela pose problème selon l'OS.

---

## Routes de l'application

### Pages publiques (sans authentification)

| Route | Composant | Description |
|---|---|---|
| `/` | `App.jsx` | Landing page |
| `/connexion` | `auth/connexion.jsx` | Connexion candidat |
| `/inscription` | `auth/inscription.jsx` | Création de compte |
| `/inscription-spontanee` | `auth/inscription-spontanee.jsx` | Candidature spontanée |
| `/mdpoublie` | `auth/mdpoublie.jsx` | Mot de passe oublié |
| `/resetpassword` | `auth/resetpassword.jsx` | Reset via token email |
| `/jobs` | `page/jobs.jsx` | Liste des offres (public) |
| `/jobs/:id` | `page/JobsID.jsx` | Détail d'une offre (public) |
| `*` | `page/NotFound.jsx` | 404 |

### Pages privées (session requise)

| Route | Composant | Description |
|---|---|---|
| `/dashbord` | `page/Dashboard.jsx` | Tableau de bord ⚠️ (typo intentionnelle) |
| `/profil` | `page/profil.jsx` | Profil candidat |
| `/candidatures` | `page/candidatures.jsx` | Suivi des candidatures |
| `/jobs-auth` | `page/JobsAuth.jsx` | Offres avec score IA |
| `/jobs-auth/:id` | `page/JobsAuthID.jsx` | Détail offre + postuler |
| `/Menu` | `page/Menu.jsx` | Shell de navigation |

### Pages tests (accessibles via lien email)

| Route | Composant |
|---|---|
| `/tests/pression` | `page/tests/pression.jsx` |
| `/tests/mbti` | `page/tests/mbti.jsx` |
| `/tests/domino` | `page/tests/domino.jsx` |
| `/tests/bigfive` | `page/tests/bigfive.jsx` |
| `/tests/anglais` | `page/tests/anglais.jsx` |

---

## Architecture des composants

### `Menu.jsx` — Layout shell

Toutes les pages privées s'imbriquent dans `<Menu>`. Il fournit :
- **Sidebar** avec navigation principale (Dashboard, Profil, Candidatures, Offres, Déconnexion)
- **Topbar** (logo, salutation heure-dépendante, cloche de notifications)
- **`<NotifBell>`** : polling toutes les 15 s vers `/notifications.php`, suppression individuelle persistante

Chaque page privée appelle `<Menu session={session}>` en passant la session issue de `useSessionGuard`.

### `useCompatibility.jsx` — Score IA

Hook + composant `<CompatibilityBadge jobId token>` qui appelle `match.php` (Mistral AI côté backend) pour calculer le score de compatibilité CV/offre. Résultats mis en cache en mémoire (`_cache` module-level). Tooltip rendu via `createPortal(document.body)` pour éviter le clipping dans les modales.

---

## Authentification et session

### Mécanisme

- À la connexion réussie, le backend retourne un `token` JWT et un objet `user` stockés dans `localStorage`.
- `useSessionGuard` est appelé en tête de chaque page privée. Il :
  1. Lit `user` + `token` dans `localStorage`
  2. Vérifie la validité côté serveur via `GET /session/verifier`
  3. Redirige vers `/connexion` si invalide / expiré
  4. Écoute l'event `storage` pour synchroniser la déconnexion multi-onglets
  5. Supporte une vérification périodique optionnelle (`checkInterval`)

```jsx
// Usage type dans une page privée
const { session, loading, logout } = useSessionGuard();
if (loading) return <div>Chargement...</div>;
```

### Déconnexion

`POST /deconnexion` avec header `Authorization: Bearer <token>` + nettoyage `localStorage` / `sessionStorage`.

---

## Endpoints backend consommés

Base URL : `VITE_API_BASE` (ex: `https://app.zenselekt.com/backoffice`)

| Endpoint | Méthode | Description |
|---|---|---|
| `/APP` | GET | Stats landing (activeJobs, totalCandidates) + recentJobs |
| `/connexion` | POST | Authentification → token + user |
| `/deconnexion` | POST | Invalidation session |
| `/session/verifier` | GET | Vérification token |
| `/inscription/submit` | POST | Création compte candidat |
| `/inscription/upload-cv` | POST | Upload CV (multipart) |
| `/mdpoublie` | POST | Envoi email reset |
| `/reset-password` | POST | Application nouveau mot de passe |
| `/csrf-token` | GET | Jeton CSRF |
| `/profil` | GET / POST | Lecture / mise à jour profil candidat |
| `/candidatures.php` | GET | Liste candidatures du candidat |
| `/notifications.php` | GET / PATCH / DELETE | Notifications in-app |
| `/postuler.php` | POST | Postuler à une offre |
| `/jobs.php` | GET | Liste des offres (avec filtres) |
| `/jobsID.php?id=` | GET | Détail d'une offre |
| `/match.php?job_id=` | GET | Score compatibilité IA (Mistral) |

### Endpoints tests (chemin **absolu hardcodé** `/backoffice/`)

Ces endpoints ignorent `VITE_API_BASE` et utilisent un chemin absolu depuis la racine du domaine :

| Endpoint | Description |
|---|---|
| `/backoffice/check_test_taken_pression.php` | Vérifier si test déjà passé |
| `/backoffice/save_test_pression.php` | Sauvegarder résultat Pression |
| `/backoffice/check_test_taken_mbti.php` | Vérifier si MBTI déjà passé |
| `/backoffice/save_test_mbti_results.php` | Sauvegarder résultat MBTI |
| `/backoffice/check_test_taken_Domino.php` | Vérifier si Domino déjà passé |
| `/backoffice/save_test_results_domino.php` | Sauvegarder résultat Domino |
| `/backoffice/check_test_taken_Personnalite.php` | Vérifier si Big Five déjà passé |
| `/backoffice/save_personality_results.php` | Sauvegarder résultat Big Five |
| `/backoffice/check_test_taken_Anglais.php` | Vérifier si test Anglais déjà passé |
| `/backoffice/save_test_results.php` | Sauvegarder résultat Anglais |

> ⚠️ En développement local, ces appels pointent vers `http://localhost/backoffice/` (pas de `localhost:5173`).  
> Cela suppose que le backend PHP est servi sur le port 80 du même domaine.

---

## Points d'attention

### Bugs / pièges connus

**1. Typo de route : `/dashbord` au lieu de `/dashboard`**  
La route est définie ainsi partout (main.jsx, Menu.jsx, connexion.jsx). C'est **cohérent** dans le code donc ne pas corriger sans tout changer d'un coup.

**2. Imports avec casse incorrecte dans `main.jsx`**  
Les imports suivants utilisent des noms capitalisés alors que les fichiers sont en minuscules :
```js
import Jobs       from "./page/Jobs.jsx";       // fichier réel : jobs.jsx
import Profil     from "./page/Profil.jsx";      // fichier réel : profil.jsx
import Candidatures from "./page/Candidatures.jsx"; // fichier réel : candidatures.jsx
```
Sous Windows (NTFS, insensible à la casse), ça fonctionne. **Sous Linux (production OVH), ça échoue au build.** À corriger si le build de prod plante.

**3. `reset_password.php` à la racine du projet Vite**  
Ce fichier PHP n'a rien à faire dans `app/`. Il appartient au dossier backend. Il ne sera pas servi par Vite, seulement par un éventuel serveur PHP. À déplacer côté backoffice.

**4. `index.html` : `lang="en"` alors que l'app est en français**  
Changer en `lang="fr"` pour l'accessibilité et le SEO.

**5. Tests psychométriques : URL backend hardcodées**  
Les 5 composants de tests utilisent `/backoffice/` en dur au lieu de `VITE_API_BASE`. Si le backend change de chemin, il faudra mettre à jour ces fichiers manuellement.

**6. `.env.production` avec line endings Windows (`\r\n`)**  
Si le serveur de build est Linux, s'assurer que ce fichier est en LF ou que Vite le gère correctement.

**7. `log.txt` commité à la racine**  
Ce fichier de log ne devrait pas être en dépôt. Ajouter `log.txt` au `.gitignore`.

---

## Build et déploiement

```bash
# Build de production
npm run build
# → génère dist/

# Prévisualiser le build localement
npm run preview
```

Le dossier `dist/` est déployé tel quel sur OVH à `https://app.zenselekt.com`.  
Le backend PHP (`/backoffice/`) est déployé séparément dans le même vhost.

### Linting

```bash
npm run lint
```

ESLint est configuré avec `eslint-plugin-react-hooks` et `eslint-plugin-react-refresh`.

---

## Développement — conseils pratiques

- Pour tester les pages privées sans faire de vraie connexion, injecter manuellement dans la console :
  ```js
  localStorage.setItem('token', 'votre-token-test')
  localStorage.setItem('user', JSON.stringify({ email: 'test@test.com', prenoms: 'Test', nom: 'User' }))
  ```
- Les tests psychométriques (`/tests/*`) reçoivent les données candidat via les **query params de l'URL** (ex: `?email=...&prenoms=...&nom=...&offre_id=...`). Ces params sont injectés dans les liens email côté backoffice.
- La cloche de notifications (polling 15 s) est active uniquement quand l'onglet est visible (`visibilitychange` listener dans `NotifBell`).

---

*Projet Zenselekt 3.0 — Empower Talents & Careers — Abidjan, Côte d'Ivoire*
