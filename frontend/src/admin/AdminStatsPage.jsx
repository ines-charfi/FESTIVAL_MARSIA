import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function AdminStatsPage() {
    const [stats, setStats] = useState(null);

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

    if (!stats) return <div>Chargement stats...</div>;

    return (
        <div>
            <h2>📊 Dashboard Admin</h2>
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>👥 Utilisateurs</h3>
                    <div className="stat-number">{stats.utilisateurs}</div>
                </div>
                <div className="stat-card">
                    <h3>🎬 Films</h3>
                    <div className="stat-number">{stats.films}</div>
                </div>
                <div className="stat-card">
                    <h3>🗳️ Votes</h3>
                    <div className="stat-number">{stats.votes}</div>
                </div>
                <div className="stat-card">
                    <h3>📧 Newsletters</h3>
                    <div className="stat-number">{stats.newsletters}</div>
                </div>
                <div className="stat-card">
                    <h3>📝 Réservations</h3>
                    <div className="stat-number">{stats.reservations}</div>
                </div>
            </div>
            <button onClick={fetchStats}>🔄 Actualiser</button>
        </div>
    );
}

export default AdminStatsPage;
