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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        setUser(null);
        setIsBackoffice(false);
        setPage('home');
        setIsMenuOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const renderPage = () => {
        switch (page) {
            case 'home': return <HomePage setPage={setPage} setUser={setUser} />;
            case 'login': return <LoginPage setUser={setUser} setPage={setPage} />;
            case 'register': return <RegisterPage setUser={setUser} setPage={setPage} />;
            case 'admin-users': return <AdminUsersPage setPage={setPage} />;
            case 'admin-stats': return <AdminStatsPage setPage={setPage} />;
            case 'soumission-film': return <SoumissionFilmPage setPage={setPage} user={user} />;
            case 'jury-dashboard': return <JuryDashboardPage setPage={setPage} user={user} />;
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
            <header className={isBackoffice ? "header-backoffice" : "header-public"}>
                <nav className="main-nav">

                    <div className="nav-left">
                        {isBackoffice ? (
                            <div className="admin-brand">
                                <span className="admin-indicator">ADMIN</span>
                                <h1>MARSIA</h1>
                            </div>
                        ) : (
                            <div className="logo">
                                <h1>🎬 MARSIA</h1>
                                <span>Festival IA 2026</span>
                            </div>
                        )}
                        <button className="burger-btn" onClick={toggleMenu}>☰</button>
                    </div>

                    <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
                        {isBackoffice ? (
                            <div className="nav-backoffice-container">
                                <div className="admin-tabs">
                                    <button className={page === 'admin-stats' ? 'tab-active' : ''} onClick={() => { setPage('admin-stats'); setIsMenuOpen(false); }}>📊 Stats</button>
                                    <button className={page === 'admin-users' ? 'tab-active' : ''} onClick={() => { setPage('admin-users'); setIsMenuOpen(false); }}>👥 Users</button>
                                    <button className={page === 'films' ? 'active' : ''} onClick={() => { setPage('films'); setIsMenuOpen(false); }}>🎬 Films</button>
                                    <button className={page === 'votes' ? 'tab-active' : ''} onClick={() => { setPage('votes'); setIsMenuOpen(false); }}>🗳️ Votes</button>
                                    <button className={page === 'newsletter' ? 'tab-active' : ''} onClick={() => { setPage('newsletter'); setIsMenuOpen(false); }}>📧 News</button>
                                    <button className={page === 'notifications' ? 'tab-active' : ''} onClick={() => { setPage('notifications'); setIsMenuOpen(false); }}>🔔 Notifications</button>
                                    <button className={page === 'outils' ? 'tab-active' : ''} onClick={() => { setPage('outils'); setIsMenuOpen(false); }}>🤖 IA</button>
                                </div>

                                <div className="admin-actions">
                                    <button className="btn-exit" onClick={() => { setIsBackoffice(false); setPage('home'); }}>
                                        ← Site Public
                                    </button>
                                    {user && <button className="btn-logout-circle" onClick={handleLogout} title="Déconnexion">🚪</button>}
                                </div>
                            </div>
                        ) : (
                            <div className="nav-public">
                                <button className={page === 'home' ? 'active' : ''} onClick={() => { setPage('home'); setIsMenuOpen(false); }}>Accueil</button>
                                {user ? (
                                    <>
                                        <span className="user-name">👋 {user.prenom}</span>
                                        {user?.nom_role === 'ADMIN' && (
                                            <button className="btn-admin-access" onClick={() => { setIsBackoffice(true); setPage('admin-stats'); setIsMenuOpen(false); }}>🔧 Dashboard</button>
                                        )}
                                        <button className="btn-logout-nav" onClick={handleLogout}>Déconnexion</button>
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

            <main className={isBackoffice ? "main-backoffice" : "main-public"}>
                {renderPage()}
            </main>
        </div>
    );
}

export default App;