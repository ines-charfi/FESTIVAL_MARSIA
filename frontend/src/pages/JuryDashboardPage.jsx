import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function JuryDashboardPage({ setPage, user }) {
    const [votes, setVotes] = useState([]);
    const [films, setFilms] = useState([]);
    const [form, setForm] = useState({
        id_film: '',
        note: '',
        commentaire: '',
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 🔹 Récupérer les votes du jury
    const fetchVotes = async () => {
        if (!user?.id_utilisateur) return;
        try {
            setError('');
            const res = await fetch(`${API_URL}/votes?jury=${user.id_utilisateur}`);
            const data = await res.json();
            setVotes(data);
        } catch {
            setError('Impossible de charger vos votes');
        }
    };

    // 🔹 Récupérer tous les films (pour titre + réalisateur)
    const fetchFilms = async () => {
        try {
            const res = await fetch(`${API_URL}/films`);
            const data = await res.json();
            setFilms(data); // chaque film doit contenir realisateur {id_utilisateur, nom, prenom}
        } catch {
            console.error('Erreur récupération films');
        }
    };

    useEffect(() => {
        if (user?.id_utilisateur) {
            fetchVotes();
            fetchFilms();
        }
    }, [user]);

    // 🔹 Fonction helper pour retrouver le film
    const getFilmInfo = (id_film) => {
        const film = films.find(f => f.id_film === id_film);
        return film || { titre: id_film, realisateur: null };
    };

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!user?.id_utilisateur) {
            setError('Utilisateur non connecté');
            return;
        }

        const payload = {
            ...form,
            id_film: Number(form.id_film),
            id_jury: user.id_utilisateur,
            note: Number(form.note),
        };

        try {
            setLoading(true);
            if (editingId) {
                await fetch(`${API_URL}/votes/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch(`${API_URL}/votes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            setForm({ id_film: '', note: '', commentaire: '' });
            setEditingId(null);
            fetchVotes();
        } catch {
            setError('Erreur enregistrement du vote');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (vote) => {
        setEditingId(vote.id_vote);
        setForm({
            id_film: vote.id_film || '',
            note: vote.note || '',
            commentaire: vote.commentaire || '',
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce vote ?')) return;
        try {
            await fetch(`${API_URL}/votes/${id}`, { method: 'DELETE' });
            fetchVotes();
        } catch {
            setError('Erreur suppression');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>⚖️ Tableau de bord Jury</h1>
                <button onClick={() => setPage('home')} className="btn-back">← Retour</button>
            </div>

            {/* Cartes résumé */}
            <div className="dashboard-grid">
                <div className="card">
                    <h3>Films à voter</h3>
                    <p>{films.length} films</p>
                </div>
                <div className="card">
                    <h3>Mes votes</h3>
                    <p>{votes.length} votés</p>
                </div>
            </div>

            {error && <p className="error">{error}</p>}

            {/* Formulaire de vote */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h2>{editingId ? '✏️ Modifier mon vote' : '🗳️ Nouveau vote'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>ID Film</label>
                        <input
                            name="id_film"
                            value={form.id_film}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Note (0-10)</label>
                        <input
                            name="note"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={form.note}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Commentaire</label>
                        <textarea
                            name="commentaire"
                            value={form.commentaire}
                            onChange={handleChange}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Enregistrement...' : editingId ? 'Mettre à jour mon vote' : 'Enregistrer mon vote'}
                    </button>
                </form>
            </div>

            {/* Tableau des votes */}
            <div style={{ marginTop: '2rem' }}>
                <h2>📋 Mes votes</h2>
                <table className="table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Film</th>
                        <th>Réalisateur</th>
                        <th>Bio</th>
                        <th>Note</th>
                        <th>Commentaire</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {votes.map(v => {
                        const film = getFilmInfo(v.id_film);
                        return (
                            <tr key={v.id_vote}>
                                <td>{v.id_vote}</td>
                                <td>{film.titre}</td>
                                <td>{film.realisateur ? `${film.realisateur.nom} ${film.realisateur.prenom}` : '-'}</td>
                                <td>
                                    {film.realisateur ? (
                                        <a
                                            href={`/biographie/${film.realisateur.id_utilisateur}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            🔗 Bio
                                        </a>
                                    ) : '-'}
                                </td>
                                <td>{v.note}</td>
                                <td>{v.commentaire}</td>
                                <td>
                                    <button onClick={() => handleEdit(v)}>✏️</button>
                                    <button onClick={() => handleDelete(v.id_vote)}>🗑️</button>
                                </td>
                            </tr>
                        );
                    })}
                    {votes.length === 0 && (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center' }}>
                                Aucun vote pour l’instant.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default JuryDashboardPage;
