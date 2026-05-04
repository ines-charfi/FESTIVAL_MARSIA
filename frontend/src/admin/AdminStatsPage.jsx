import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api';

function AdminStatsPage({ t }) { // 👈 Ajout de 't' pour les traductions
    const [stats, setStats] = useState(null);

    // Détection de la langue
    const isFR = t.nav_home === "Accueil";

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/stats`);
            const data = await res.json();
            setStats(data.stats);
        } catch {
            console.error('Erreur stats');
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (!stats) {
        return (
            <div className="admin-stats-container">
                {isFR ? "Chargement stats..." : "Loading stats..."}
            </div>
        );
    }

    return (
        <div className="admin-stats-container">
            <h2>📊 {isFR ? "Dashboard Admin" : "Admin Dashboard"}</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>👥 {isFR ? "Utilisateurs" : "Users"}</h3>
                    <div className="stat-number">{stats.utilisateurs ?? 0}</div>
                </div>

                <div className="stat-card">
                    <h3>🎬 {isFR ? "Films" : "Movies"}</h3>
                    <div className="stat-number">{stats.films ?? 0}</div>
                </div>

                <div className="stat-card">
                    <h3>🗳️ {isFR ? "Votes" : "Votes"}</h3>
                    <div className="stat-number">{stats.votes ?? 0}</div>
                </div>

                <div className="stat-card">
                    <h3>🔔 {isFR ? "Notifications" : "Notifications"}</h3>
                    <div className="stat-number">{stats.notifications ?? 0}</div>
                </div>

                <div className="stat-card">
                    <h3>📧 {isFR ? "Newsletters" : "Newsletters"}</h3>
                    <div className="stat-number">{stats.newsletters ?? 0}</div>
                </div>

                {/* 🚀 CARTE IA TRADUITE */}
                <div className="stat-card stat-ia">
                    <h3>🤖 {isFR ? "Outils IA" : "AI Tools"}</h3>
                    <div className="stat-number">{stats.outils_ia ?? 0}</div>
                </div>
            </div>

            <button className="btn-refresh" onClick={fetchStats}>
                <span>🔄</span> {isFR ? "Actualiser les données" : "Refresh Data"}
            </button>
        </div>
    );
}

export default AdminStatsPage;