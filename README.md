# 🎬 MarsIA - Festival de Court-Métrage & IA

![Banner](https://img.shields.io/badge/Status-In_Development-orange)
![Tech](https://img.shields.io/badge/Stack-React_%7C_Node.js_%7C_MySQL-blue)
![License](https://img.shields.io/badge/License-MIT-green)

> **MarsIA** est une plateforme moderne de gestion de festival de cinéma. Elle permet aux réalisateurs de soumettre leurs œuvres, aux membres du jury de noter les films en temps réel et aux administrateurs de modérer le contenu avec une touche d'intelligence artificielle.

---

## 🌟 Fonctionnalités Clés

### 🎥 Pour les Réalisateurs
- **Espace Personnel** : Gestion complète du profil et de la biographie avec photo.
- **Soumission de Films** : Upload de fichiers vidéo locaux ou intégration de liens YouTube.
- **Suivi en Direct** : Visualisation du statut de modération de ses films (En attente / Approuvé / Rejeté).

### ⚖️ Pour le Jury
- **Dashboard Dynamique** : Vue d'ensemble sur le nombre de films restant à évaluer.
- **Visionnage Intégré** : Accès direct aux vidéos en un clic.
- **Système de Notation** : Interface intuitive pour noter (sur 10) et commenter chaque œuvre.

### 🛡️ Pour l'Administration
- **Modération de Contenu** : Approbation ou rejet des films soumis.
- **Analyse IA** : Intégration de l'API SightEngine pour détecter les contenus sensibles (nudité, violence, etc.).
- **Gestion des Utilisateurs** : Contrôle total sur les comptes Réalisateurs et Jurys.

---

## 🚀 Stack Technique

Le projet repose sur une architecture robuste et scalable :

| Partie | Technologie |
| :--- | :--- |
| **Frontend** | [React.js](https://reactjs.org/) (Hooks, Context, Router) |
| **Backend** | [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) |
| **Base de données** | [MySQL](https://www.mysql.com/) |
| **Gestion Fichiers** | [Multer](https://github.com/expressjs/multer) |
| **Design** | CSS3 Modern (Flexbox, Grid) |

---

## 🛠️ Installation et Configuration

### 1. Pré-requis
- Node.js (v14+)
- MySQL
- Un compte SightEngine (pour l'IA de modération)

### 2. Clonage et Backend
```bash
# Cloner le dépôt
git clone [https://github.com/votre-utilisateur/marsia.git](https://github.com/votre-utilisateur/marsia.git)
cd marsia/backend

# Installer les dépendances
npm install

# Configurer la base de données (MySQL)
# Importez le fichier .sql fourni dans votre base de données 'marsia'

📁 Structure du Projet
├── backend/
│   ├── uploads/          # Stockage des vidéos et photos
│   ├── index.js          # Serveur Express et API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Pages (Jury, Bio, Soumission...)
│   │   └── App.js        # Logique de navigation
│   └── public/
└── README.md



# Lancer le serveur
cd ../backend
node index.js
cd ../frontend
npm install
npm start

