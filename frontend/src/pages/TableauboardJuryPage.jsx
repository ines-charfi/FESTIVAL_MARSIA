import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api';

function TableauboardJuryPage({ setPage, user, t }) {
    const [votes, setVotes] = useState([]);
    const [filmsDisponibles, setFilmsDisponibles] = useState([]);
    const [form, setForm] = useState({
        id_film: '',
        note: '',
        commentaire: '',
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    const isFR = t.nav_home === "Accueil";

    // 🔄 Charger les données
    const fetchDashboardData = async () => {
        try {
            setError('');
            const resVotes = await fetch(`${API_URL}/votes?jury=${user?.id}`);
            const dataVotes = await resVotes.json();
            setVotes(dataVotes);

            const resFilms = await fetch(`http://localhost:8081/api/v1/films`);
            const dataFilms = await resFilms.json();
            setFilmsDisponibles(dataFilms.filter(f => f.statut_moderation === 'approuve'));
        } catch (err) {
            setError(isFR ? 'Erreur lors du chargement des données' : 'Error loading data');
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData();
        }
    }, [user, isFR]);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleView = (film) => {
        if (film.lien_youtube) {
            window.open(film.lien_youtube, '_blank');
        } else if (film.fichier_video) {
            window.open(`http://localhost:8081/${film.fichier_video}`, '_blank');
        } else {
            alert(isFR ? "Vidéo non disponible" : "Video not available");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!user || !user.id) {
            setError(isFR ? "Utilisateur non identifié" : "User not identified");
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
                alert(editingId
                    ? (isFR ? "Vote modifié" : "Vote updated")
                    : (isFR ? "Vote enregistré" : "Vote recorded")
                );
                setEditingId(null);
                setForm({ id_film: '', note: '', commentaire: '' });
                fetchDashboardData();
            }
        } catch (err) {
            setError(isFR ? "Erreur lors de l'enregistrement" : "Error during save");
        }
    };

    const handleEdit = (vote) => {
        setEditingId(vote.id_vote);
        setForm({
            id_film: vote.id_film || '',
            note: vote.note || '',
            commentaire: vote.commentaire || '',
        });
        window.scrollTo({ top: 500, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isFR ? 'Supprimer ce vote ?' : 'Delete this vote?')) return;
        try {
            await fetch(`${API_URL}/votes/${id}`, { method: 'DELETE' });
            fetchDashboardData();
        } catch {
            setError(isFR ? 'Erreur suppression' : 'Deletion error');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>⚖️ {isFR ? "Tableau de bord Jury" : "Jury Dashboard"}</h1>
                <button onClick={() => setPage('home')} className="btn-back">
                    ← {isFR ? "Retour" : "Back"}
                </button>
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div
                    className="card"
                    style={{ cursor: 'pointer', border: '2px solid #6366f1', transition: 'transform 0.2s' }}
                    onClick={() => document.getElementById('section-galerie').scrollIntoView({ behavior: 'smooth' })}
                >
                    <h3 style={{ color: '#6366f1' }}>🎬 {isFR ? "Films à voter" : "Films to vote"}</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{filmsDisponibles.length} films</p>
                    <small>{isFR ? "Cliquez pour voir la liste ↓" : "Click to see the list ↓"}</small>
                </div>

                <div className="card">
                    <h3>✅ {isFR ? "Mes votes" : "My votes"}</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{votes.length} {isFR ? "votés" : "voted"}</p>
                </div>
                <div className="card">
                    <h3>📈 {isFR ? "Progression" : "Progress"}</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {filmsDisponibles.length > 0 ? Math.round((votes.length / filmsDisponibles.length) * 100) : 0}%
                    </p>
                </div>
            </div>

            {error && <p className="error" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <div id="section-galerie" style={{ marginTop: '3rem' }}>
                <h2>🎥 {isFR ? "Films à évaluer" : "Films to evaluate"}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {filmsDisponibles.map((film) => (
                        <div key={film.id_film} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h4 style={{ marginBottom: '0.5rem' }}>{film.titre}</h4>
                                <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                    {isFR ? "Pays" : "Country"}: {film.pays || (isFR ? 'Non précisé' : 'Not specified')}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                <button className="btn-small" onClick={() => handleView(film)}>
                                    👁️ {isFR ? "Voir" : "View"}
                                </button>
                                <button
                                    className="btn-primary btn-small"
                                    onClick={() => {
                                        setForm({ ...form, id_film: film.id_film });
                                        setError('');
                                    }}
                                >
                                    🗳️ {isFR ? "Voter" : "Vote"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ marginTop: '3rem', background: '#f9f9ff' }}>
                <h2>{editingId ? (isFR ? '✏️ Modifier mon vote' : '✏️ Edit my vote') : (isFR ? '🗳️ Enregistrer un vote' : '🗳️ Record a vote')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>{isFR ? "ID Film (sélectionné via la liste)" : "Film ID (selected via list)"}</label>
                        <input
                            name="id_film"
                            value={form.id_film}
                            readOnly
                            placeholder={isFR ? "Cliquez sur 'Voter' dans la galerie" : "Click 'Vote' in the gallery"}
                            style={{ background: '#eee' }}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>{isFR ? "Note (0-10)" : "Rating (0-10)"}</label>
                        <input
                            name="note"
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
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
                            placeholder={isFR ? "Pourquoi cette note ?" : "Why this rating?"}
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        {editingId ? (isFR ? 'Mettre à jour' : 'Update') : (isFR ? 'Confirmer mon vote' : 'Confirm my vote')}
                    </button>
                    {editingId && (
                        <button type="button" onClick={() => { setEditingId(null); setForm({id_film:'', note:'', commentaire:''}); }} style={{ marginLeft: '10px' }}>
                            {isFR ? "Annuler" : "Cancel"}
                        </button>
                    )}
                </form>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <h2>📋 {isFR ? "Récapitulatif de mes votes" : "Summary of my votes"}</h2>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ background: '#6366f1', color: 'white' }}>
                        <th style={{ padding: '10px' }}>{isFR ? "Film ID" : "Movie ID"}</th>
                        <th>{isFR ? "Note" : "Rating"}</th>
                        <th>Commentaire</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {votes.map((v) => (
                        <tr key={v.id_vote} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '10px', textAlign: 'center' }}>#{v.id_film}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{v.note}/10</td>
                            <td>{v.commentaire}</td>
                            <td style={{ textAlign: 'center' }}>
                                <button onClick={() => handleEdit(v)} style={{ marginRight: '5px' }}>✏️</button>
                                <button onClick={() => handleDelete(v.id_vote)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TableauboardJuryPage;