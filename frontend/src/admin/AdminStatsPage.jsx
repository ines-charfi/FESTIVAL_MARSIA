import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function AdminStatsPage() {
    const [stats, setStats] = useState(null);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/stats`);
            const data = await res.json();
            // On s'attend à ce que data.stats contienne maintenant "notifications"
            setStats(data.stats);
        } catch {
            console.error('Erreur stats');
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (!stats) return <div className="admin-stats-container">Chargement stats...</div>;

    return (
        <div className="admin-stats-container">
            <h2>📊 Dashboard Admin</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>👥 Utilisateurs</h3>
                    <div className="stat-number">{stats.utilisateurs ?? 0}</div>
                </div>

                <div className="stat-card">
                    <h3>🎬 Films</h3>
                    <div className="stat-number">{stats.films ?? 0}</div>
                </div>

                <div className="stat-card">
                    <h3>🗳️ Votes</h3>
                    <div className="stat-number">{stats.votes ?? 0}</div>
                </div>

                <div className="stat-card">
                    <h3>🔔 Notifications</h3>
                    <div className="stat-number">{stats.notifications ?? 0}</div>
                </div>

                <div className="stat-card">
                    <h3>📧 Newsletters</h3>
                    <div className="stat-number">{stats.newsletters ?? 0}</div>
                </div>

                {/* 🚀 NOUVELLE CARTE IA */}
                <div className="stat-card stat-ia">
                    <h3>🤖 Outils IA</h3>
                    <div className="stat-number">{stats.outils_ia ?? 0}</div>
                </div>
            </div>

            <button className="btn-refresh" onClick={fetchStats}>
                <span>🔄</span> Actualiser les données
            </button>
        </div>
    );
}

export default AdminStatsPage;