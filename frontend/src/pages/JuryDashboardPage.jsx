import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function JuryDashboardPage({ setPage, user }) {
    const [votes, setVotes] = useState([]);
    const [filmsDisponibles, setFilmsDisponibles] = useState([]);
    const [form, setForm] = useState({
        id_film: '',
        note: '',
        commentaire: '',
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    // 🔄 Charger les données
    const fetchData = async () => {
        try {
            setError('');
            // 1. Charger les votes (avec infos réalisateurs via le backend)
            const resVotes = await fetch(`${API_URL}/votes?jury=${user?.id}`);
            const dataVotes = await resVotes.json();
            setVotes(dataVotes);

            // 2. Charger les films pour le compteur
            const resFilms = await fetch(`${API_URL}/films`);
            const dataFilms = await resFilms.json();
            setFilmsDisponibles(dataFilms.filter(f => f.statut_moderation === 'approuve'));
        } catch {
            setError('Impossible de charger les données');
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user]);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!user || !user.id) {
            setError("Utilisateur non identifié");
            return;
        }

        const voteData = { ...form, id_jury: user.id };

        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${API_URL}/votes/${editingId}` : `${API_URL}/votes`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(voteData)
            });

            if (res.ok) {
                alert(editingId ? "Vote modifié" : "Vote enregistré");
                setEditingId(null);
                setForm({ id_film: '', note: '', commentaire: '' });
                fetchData();
            }
        } catch (err) {
            setError("Erreur lors de l'enregistrement du vote");
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
            fetchData();
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
                <div className="card"
                     style={{ cursor: 'pointer' }}
                     onClick={() => document.getElementById('liste-films').scrollIntoView({ behavior: 'smooth' })}>
                    <h3>Films à voter</h3>
                    <p>{filmsDisponibles.length} films</p>
                </div>
                <div className="card">
                    <h3>Mes votes</h3>
                    <p>{votes.length} votés</p>
                </div>
                <div className="card">
                    <h3>Classement</h3>
                    <p>Position #3</p>
                </div>
            </div>

            {error && <p className="error">{error}</p>}

            {/* Formulaire de vote */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h2>{editingId ? '✏️ Modifier mon vote' : '🗳️ Nouveau vote'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>ID Film</label>
                        <input name="id_film" value={form.id_film} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Note (0-10)</label>
                        <input name="note" type="number" min="0" max="10" step="0.1" value={form.note} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Commentaire</label>
                        <textarea name="commentaire" value={form.commentaire} onChange={handleChange} />
                    </div>
                    <button type="submit" className="btn-primary">
                        {editingId ? 'Mettre à jour mon vote' : 'Enregistrer mon vote'}
                    </button>
                </form>
            </div>

            {/* Liste des votes du jury (Tableau conservé et enrichi) */}
            <div id="liste-films" style={{ marginTop: '2rem' }}>
                <h2>📋 Mes votes</h2>
                <table className="table">
                    <thead>
                    <tr>
                        <th>ID Film</th>
                        <th>Titre du Film</th>
                        <th>Réalisateur (Bio)</th> {/* Nouvelle colonne */}
                        <th>Note</th>
                        <th>Commentaire</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {votes.map((v) => (
                        <tr key={v.id_vote}>
                            <td>#{v.id_film}</td>
                            <td>{v.film_titre || "N/A"}</td>
                            <td>
                                {/* Affichage du nom et lien vers la bio */}
                                {v.realisateur_nom ? (
                                    <button
                                        onClick={() => alert(`Voir la bio de ${v.realisateur_prenom} ${v.realisateur_nom}`)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#6366f1',
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                            padding: 0,
                                            textAlign: 'left'
                                        }}
                                    >
                                        👤 {v.realisateur_prenom} {v.realisateur_nom}
                                    </button>
                                ) : (
                                    <span style={{ color: '#999' }}>Non renseigné</span>
                                )}
                            </td>
                            <td style={{ fontWeight: 'bold' }}>{v.note}/10</td>
                            <td>{v.commentaire}</td>
                            <td>
                                <button onClick={() => handleEdit(v)}>✏️</button>
                                <button onClick={() => handleDelete(v.id_vote)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                    {votes.length === 0 && (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center' }}>
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