import React, { useState, useEffect } from 'react';
import './App.css';
import { translations } from './translations'; // 👈 Import des traductions

// 🌐 PAGES PUBLIQUES
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PalmaresPage from './pages/PalmaresPage.jsx'

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
    const [lang, setLang] = useState('fr'); // 👈 État de la langue (fr ou en)

    const t = translations[lang]; // 👈 Raccourci pour utiliser les textes

    const handleLogout = () => {
        setUser(null);
        setIsBackoffice(false);
        setPage('home');
        setIsMenuOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // 👈 On passe 't' à TOUTES les pages pour qu'elles se traduisent
    const renderPage = () => {
        switch (page) {
            case 'home': return <HomePage setPage={setPage} setUser={setUser} t={t} />;
            case 'login': return <LoginPage setUser={setUser} setPage={setPage} t={t} />;
            case 'register': return <RegisterPage setUser={setUser} setPage={setPage} t={t} />;
            case 'admin-users': return <AdminUsersPage setPage={setPage} t={t} />;
            case 'admin-stats': return <AdminStatsPage setPage={setPage} t={t} />;
            case 'soumission-film': return <SoumissionFilmPage setPage={setPage} user={user} t={t} />;
            case 'jury-dashboard': return <JuryDashboardPage setPage={setPage} user={user} t={t} />;
            case 'films': return <FilmsPage setPage={setPage} t={t} />;
            case 'votes': return <VotesPage setPage={setPage} t={t} />;
            case 'newsletter': return <NewsletterPage setPage={setPage} t={t} />;
            case 'notifications': return <NotificationsPage setPage={setPage} t={t} />;
            case 'outils': return <OutilsIAPage setPage={setPage} t={t} />;
            case 'biographie': return <BiographiePage setPage={setPage} t={t} />;
            case 'palmares': return <PalmaresPage setPage={setPage} t={t}  />;
            default: return <HomePage setPage={setPage} setUser={setUser} t={t} />;
        }
    };

    return (
        <div className="app">
            <header className={isBackoffice ? "header-backoffice" : "header-public"}>
                <nav className="main-nav">

                    <div className="nav-left">
                        {isBackoffice ? (
                            <div className="admin-brand" onClick={() => setPage('home')} style={{cursor: 'pointer'}}>
                                {/* Logo version Admin */}
                                <img src="./public/logo.png" alt="Logo" className="nav-logo-img admin-logo" />
                                <div className="admin-text-group">
                                    <h1 className="nav-title-text">MARSIA</h1>
                                </div>
                            </div>
                        ) : (
                            <div className="logo" onClick={() => setPage('home')} style={{cursor: 'pointer'}}>
                                {/* Logo version Publique */}
                                <img src="./public/logo.png" alt="MARSIA Festival" className="nav-logo-img" />
                                <div className="logo-text-group">
                                    <h1 className="nav-title-text">MARSIA</h1>
                                    <span className="nav-subtitle-text">Festival IA 2026</span>
                                </div>
                            </div>
                        )}
                        <button className="burger-btn" onClick={toggleMenu}>☰</button>
                    </div>

                    <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>

                        {/* 👈 LE BOUTON DE LANGUE AVEC IMAGES POUR ÊTRE SÛR DE VOIR LES DRAPEAUX */}
                        <button className="btn-lang-switch" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}>
                            {lang === 'fr' ? (
                                <>
                                    <img src="https://flagcdn.com/w40/gb.png" alt="EN" className="flag-img" />
                                    <span className="lang-text">EN</span>
                                </>
                            ) : (
                                <>
                                    <img src="https://flagcdn.com/w40/fr.png" alt="FR" className="flag-img" />
                                    <span className="lang-text">FR</span>
                                </>
                            )}
                        </button>

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
                                        ← {lang === 'fr' ? 'Site Public' : 'Public Site'}
                                    </button>
                                    {user && <button className="btn-logout-circle" onClick={handleLogout} title="Déconnexion">🚪</button>}
                                </div>
                            </div>
                        ) : (
                            <div className="nav-public">
                                <button className={page === 'home' ? 'active' : ''} onClick={() => { setPage('home'); setIsMenuOpen(false); }}>{t.nav_home || 'Accueil'}</button>
                                <button className={page === 'palmares' ? 'active' : ''} onClick={() => { setPage('palmares'); setIsMenuOpen(false); }}>{t.nav_palmares || 'Palmarès'}</button>

                                {user ? (
                                    <>
                                        <span className="user-name">👋 {user.prenom}</span>
                                        {user?.nom_role === 'ADMIN' && (
                                            <button className="btn-admin-access" onClick={() => { setIsBackoffice(true); setPage('admin-stats'); setIsMenuOpen(false); }}>🔧 Dashboard</button>
                                        )}
                                        <button className="btn-logout-nav" onClick={handleLogout}>{lang === 'fr' ? 'Déconnexion' : 'Logout'}</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setPage('login'); setIsMenuOpen(false); }}>{lang === 'fr' ? 'Connexion' : 'Login'}</button>
                                        <button className="btn-cta" onClick={() => { setPage('register'); setIsMenuOpen(false); }}>{lang === 'fr' ? "S'inscrire" : 'Register'}</button>
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