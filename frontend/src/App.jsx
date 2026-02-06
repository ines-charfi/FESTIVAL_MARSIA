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
import JuryDashboardPage from "./pages/JuryDashboardPage.jsx";

function App() {
    const [page, setPage] = useState('home');
    const [user, setUser] = useState(null);
    const [isBackoffice, setIsBackoffice] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // 🌟 burger menu

    // 🌟 Fonction de déconnexion
    const handleLogout = () => {
        setUser(null);
        setIsBackoffice(false);
        setPage('home');
        setIsMenuOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const renderPage = () => {
        switch (page) {
            // 🌐 PUBLIC
            case 'home': return <HomePage setPage={setPage} setUser={setUser} />;
            case 'login': return <LoginPage setUser={setUser} setPage={setPage} />;
            case 'register': return <RegisterPage setUser={setUser} setPage={setPage} />;

            // 🔑 PAGES PAR RÔLE
            case 'admin-users': return <AdminUsersPage setPage={setPage} />;
            case 'admin-stats': return <AdminStatsPage setPage={setPage} />;
            case 'soumission-film': return <SoumissionFilmPage setPage={setPage} user={user} />;
            case 'jury-dashboard': return <JuryDashboardPage setPage={setPage} user={user} />;

            // 📋 BACKOFFICE (TES PAGES)
            case 'films': return <FilmsPage setPage={setPage} />;
            case 'votes': return <VotesPage setPage={setPage} />;
            case 'newsletter': return <NewsletterPage setPage={setPage} />;
            case 'notifications': return <NotificationsPage setPage={setPage} />;
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
                    {/* LOGO + BURGER */}
                    <div className="nav-left">
                        {isBackoffice ? (
                            <>
                                <h1>🔧 Dashboard</h1>
                                <button
                                    className="btn-back"
                                    onClick={() => { setIsBackoffice(false); setPage('home'); }}
                                >
                                    ← Site Public
                                </button>
                            </>
                        ) : (
                            <div className="logo">
                                <h1>🎬 MARSIA</h1>
                                <span>Festival IA Court-Métrage 2026</span>
                            </div>
                        )}

                        {/* Burger menu */}
                        <button className="burger-btn" onClick={toggleMenu}>
                            ☰
                        </button>
                    </div>

                    {/* NAVIGATION PRINCIPALE */}
                    <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
                        {isBackoffice ? (
                            <div className="nav-backoffice">
                                <div className="nav-group">
                                    <h4>🔐 Gestion Admin </h4>
                                    <button className={page === 'admin-users' ? 'active' : ''} onClick={() => { setPage('admin-users'); setIsMenuOpen(false); }}>👥 Utilisateurs</button>
                                    <button className={page === 'films' ? 'active' : ''} onClick={() => { setPage('films'); setIsMenuOpen(false); }}>🎬 Films</button>
                                    <button className={page === 'votes' ? 'active' : ''} onClick={() => { setPage('votes'); setIsMenuOpen(false); }}>🗳️ Votes</button>
                                    <button className={page === 'newsletter' ? 'active' : ''} onClick={() => { setPage('newsletter'); setIsMenuOpen(false); }}>📧 Newsletter</button>
                                    <button className={page === 'admin-stats' ? 'active' : ''} onClick={() => { setPage('admin-stats'); setIsMenuOpen(false); }}>📊 Stats</button>
                                    <button className={page === 'notifications' ? 'active' : ''} onClick={() => { setPage('notifications'); setIsMenuOpen(false); }}>🔔 Notifications</button>
                                </div>
                                {user && (
                                    <button className="btn-logout" onClick={handleLogout}>🚪 Déconnexion</button>
                                )}
                            </div>
                        ) : (
                            <div className="nav-public">
                                <button className={page === 'home' ? 'active' : ''} onClick={() => { setPage('home'); setIsMenuOpen(false); }}>Accueil</button>
                                {user ? (
                                    <>
                                        <span>👋 {user.prenom}</span>
                                        {user?.nom_role === 'ADMIN' && (
                                            <button className="btn-admin" onClick={() => { setIsBackoffice(true); setPage('admin-users'); setIsMenuOpen(false); }}>🔧 Backoffice</button>
                                        )}
                                        <button className="btn-logout" onClick={handleLogout}>🚪 Déconnexion</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setPage('login'); setIsMenuOpen(false); }}>Connexion</button>
                                        <button className="btn-cta" onClick={() => { setPage('register'); setIsMenuOpen(false); }}>S'inscrire</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
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
