import React, { useState } from 'react';
import './App.css';

// 🌐 PAGES PUBLIQUES
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// 📋 TES PAGES BACKOFFICE
import FilmsPage from './pages/FilmsPage.jsx';
import VotesPage from './pages/VotesPage.jsx';
import NewsletterPage from './pages/NewsletterPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import OutilsIAPage from './pages/OutilsIAPage.jsx';
import BiographiePage from './pages/BiographiePage.jsx';

// 🔐 PAGES ADMIN
import AdminUsersPage from './admin/AdminUsersPage.jsx';
import AdminStatsPage from './admin/AdminStatsPage.jsx';
import SoumissionFilmPage from "./pages/SoumissionFilmPage.jsx";
//import  JuryDashboardPage from "./pages/JuryDashboardPage.jsx";

function App() {
    const [page, setPage] = useState('home');
    const [user, setUser] = useState(null);
    const [isBackoffice, setIsBackoffice] = useState(false);

    const renderPage = () => {
        switch (page) {
            // 🌐 PUBLIC
            case 'home': return <HomePage setPage={setPage} setUser={setUser} />;
            case 'login': return <LoginPage setUser={setUser} setPage={setPage} />;
            case 'register': return <RegisterPage setUser={setUser} setPage={setPage} />;

            // 🔑 PAGES PAR RÔLE
            case 'admin-users': return <AdminUsersPage setPage={setPage} />;
            case 'admin-stats': return <AdminStatsPage setPage={setPage} />; // ✅ AJOUTÉ
            case 'soumission-film': return <SoumissionFilmPage setPage={setPage} />;
            //case 'jury-dashboard': return <JuryDashboardPage setPage={setPage} user={user} />;

            // 📋 BACKOFFICE (TES PAGES)
            case 'films': return <FilmsPage setPage={setPage} />; // ✅ setPage ajouté
            case 'votes': return <VotesPage setPage={setPage} />; // ✅ setPage ajouté
            case 'newsletter': return <NewsletterPage setPage={setPage} />; // ✅ setPage ajouté
            case 'notifications': return <NotificationsPage setPage={setPage} />; // ✅ setPage ajouté
            case 'outils': return <OutilsIAPage setPage={setPage} />;
            case 'biographie': return <BiographiePage setPage={setPage} />;

            default: return <HomePage setPage={setPage} setUser={setUser} />;
        }
    };

    return (
        <div className="app">
            {/* HEADER DYNAMIQUE */}
            <header className={isBackoffice ? "header-backoffice" : "header-public"}>
                <nav className="main-nav">
                    {isBackoffice ? (
                        /* 🔧 BACKOFFICE MODE */
                        <>
                            <div className="nav-left">
                                <h1>🔧Dashboard Admin</h1>
                                <button className="btn-back" onClick={() => setIsBackoffice(false)}>
                                    ← Site Public
                                </button>
                            </div>
                            <div className="nav-backoffice">
                                <div className="nav-group">
                                    <h4>🔐 Gestion Admin </h4>
                                    <button className={page === 'admin-users' ? 'active' : ''} onClick={() => setPage('admin-users')}>
                                        👥  Utilisateurs
                                    </button>
                                    <button className={page === 'films' ? 'active' : ''} onClick={() => setPage('films')}>
                                        🎬 Films
                                    </button>
                                    <button className={page === 'votes' ? 'active' : ''} onClick={() => setPage('votes')}>
                                        🗳️ Votes
                                    </button>
                                    <button className={page === 'newsletter' ? 'active' : ''} onClick={() => setPage('newsletter')}>
                                        📧 Newsletter
                                    </button>
                                    <button className={page === 'admin-stats' ? 'active' : ''} onClick={() => setPage('admin-stats')}>
                                        📊 Stats
                                    </button>
                                    <button className={page === 'notifications' ? 'active' : ''} onClick={() => setPage('notifications')}>
                                        🔔 Notifications
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* 🌐 PUBLIC MODE */
                        <>
                            <div className="logo">
                                <h1>🎬 MARSIA</h1>
                                <span>Festival IA Court-Métrage 2026</span>
                            </div>
                            <div className="nav-public">
                                <button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}>
                                    Accueil
                                </button>
                                {user ? (
                                    <>
                                        <span>👋 {user.prenom}</span>
                                        {/* Bouton Backoffice visible SEULEMENT pour ADMIN */}
                                        {user.nom_role === 'ADMIN' && (
                                            <button className="btn-admin" onClick={() => setIsBackoffice(true)}>
                                                🔧 Backoffice
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setPage('login')}>Connexion</button>
                                        <button className="btn-cta" onClick={() => setPage('register')}>
                                            S'inscrire
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </nav>
            </header>

            {/* CONTENU */}
            <main className={isBackoffice ? "main-backoffice" : "main-public"}>
                {renderPage()}
            </main>
        </div>
    );
}

export default App;
