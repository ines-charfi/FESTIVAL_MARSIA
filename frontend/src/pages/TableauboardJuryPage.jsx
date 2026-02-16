import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function TableauboardJuryPage({ setPage, user }) {
    const [votes, setVotes] = useState([]);
    const [filmsDisponibles, setFilmsDisponibles] = useState([]); // Nouvel état pour les films
    const [form, setForm] = useState({
        id_film: '',
        note: '',
        commentaire: '',
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    // 🔄 Charger les données (Votes + Films approuvés)
    const fetchDashboardData = async () => {
        try {
            setError('');

            // 1. Charger les votes du jury connecté
            // Note : On utilise user.id (Solution B)
            const resVotes = await fetch(`${API_URL}/votes?jury=${user?.id}`);
            const dataVotes = await resVotes.json();
            setVotes(dataVotes);

            // 2. Charger tous les films pour extraire ceux à voter
            const resFilms = await fetch(`http://localhost:8081/api/v1/films`);
            const dataFilms = await resFilms.json();
            // On ne garde que les films approuvés par la modération
            setFilmsDisponibles(dataFilms.filter(f => f.statut_moderation === 'approuve'));

        } catch (err) {
            setError('Erreur lors du chargement des données');
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData();
        }
    }, [user]);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    // Fonction pour visionner un film
    const handleView = (film) => {
        if (film.lien_youtube) {
            window.open(film.lien_youtube, '_blank');
        } else if (film.fichier_video) {
            window.open(`http://localhost:8081/${film.fichier_video}`, '_blank');
        } else {
            alert("Vidéo non disponible");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!user || !user.id) {
            setError("Utilisateur non identifié");
            return;
        }

        const voteData = {
            ...form,
            id_jury: user.id
        };

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
                fetchDashboardData();
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
        // Remonter doucement vers le formulaire
        window.scrollTo({ top: 500, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce vote ?')) return;
        try {
            await fetch(`${API_URL}/votes/${id}`, { method: 'DELETE' });
            fetchDashboardData();
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
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {/* LA CARTE MODIFIÉE : DEVIENT UN BOUTON */}
                <div
                    className="card"
                    style={{ cursor: 'pointer', border: '2px solid #6366f1', transition: 'transform 0.2s' }}
                    onClick={() => document.getElementById('section-galerie').scrollIntoView({ behavior: 'smooth' })}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <h3 style={{ color: '#6366f1' }}>🎬 Films à voter</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{filmsDisponibles.length} films</p>
                    <small>Cliquez pour voir la liste ↓</small>
                </div>

                <div className="card">
                    <h3>✅ Mes votes</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{votes.length} votés</p>
                </div>
                <div className="card">
                    <h3>📈 Progression</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {filmsDisponibles.length > 0 ? Math.round((votes.length / filmsDisponibles.length) * 100) : 0}%
                    </p>
                </div>
            </div>

            {error && <p className="error" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            {/* NOUVELLE SECTION : GALERIE DES FILMS */}
            <div id="section-galerie" style={{ marginTop: '3rem' }}>
                <h2>🎥 Films à évaluer</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {filmsDisponibles.map((film) => (
                        <div key={film.id_film} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h4 style={{ marginBottom: '0.5rem' }}>{film.titre}</h4>
                                <p style={{ fontSize: '0.8rem', color: '#666' }}>Pays: {film.pays || 'Non précisé'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                <button className="btn-small" onClick={() => handleView(film)}>👁️ Voir</button>
                                <button
                                    className="btn-primary btn-small"
                                    onClick={() => {
                                        setForm({ ...form, id_film: film.id_film });
                                        setError(''); // Reset erreur si le jury clique sur voter
                                    }}
                                >
                                    🗳️ Voter
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Formulaire de vote */}
            <div className="card" style={{ marginTop: '3rem', background: '#f9f9ff' }}>
                <h2>{editingId ? '✏️ Modifier mon vote' : '🗳️ Enregistrer un vote'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>ID Film (sélectionné via la liste ci-dessus)</label>
                        <input
                            name="id_film"
                            value={form.id_film}
                            onChange={handleChange}
                            readOnly // Le jury ne doit pas se tromper d'ID
                            placeholder="Cliquez sur 'Voter' dans la galerie"
                            style={{ background: '#eee' }}
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
                            placeholder="Pourquoi cette note ?"
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        {editingId ? 'Mettre à jour mon vote' : 'Confirmer mon vote'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={() => { setEditingId(null); setForm({id_film:'', note:'', commentaire:''}); }} style={{ marginLeft: '10px' }}>
                            Annuler
                        </button>
                    )}
                </form>
            </div>

            {/* Liste des votes du jury */}
            <div style={{ marginTop: '3rem' }}>
                <h2>📋 Récapitulatif de mes votes</h2>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ background: '#6366f1', color: 'white' }}>
                        <th style={{ padding: '10px' }}>Film ID</th>
                        <th>Note</th>
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