import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function JuryDashboardPage({ setPage, user }) {
    const [votes, setVotes] = useState([]);
    const [form, setForm] = useState({
        id_film: '',
        note: '',
        commentaire: '',
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    // 🔄 Charger les votes (Utilisation de user.id pour la Solution B)
    const fetchVotes = async () => {
        try {
            setError('');
            // Utilisation de user.id ici
            const res = await fetch(`${API_URL}/votes?jury=${user?.id}`);
            const data = await res.json();
            setVotes(data);
        } catch {
            setError('Impossible de charger vos votes');
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchVotes();
        }
    }, [user]);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Vérification avec user.id
        if (!user || !user.id) {
            setError("Utilisateur non identifié");
            return;
        }

        const voteData = {
            ...form,
            id_jury: user.id // Solution B
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
                fetchVotes();
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
                    <p>{12 /* à remplacer par un vrai nombre */} films</p>
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

            {/* Erreur éventuelle */}
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
                    <button type="submit" className="btn-primary">
                        {editingId ? 'Mettre à jour mon vote' : 'Enregistrer mon vote'}
                    </button>
                </form>
            </div>

            {/* Liste des votes du jury */}
            <div style={{ marginTop: '2rem' }}>
                <h2>📋 Mes votes</h2>
                <table className="table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Film</th>
                        <th>Note</th>
                        <th>Commentaire</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {votes.map((v) => (
                        <tr key={v.id_vote}>
                            <td>{v.id_vote}</td>
                            <td>{v.id_film}</td>
                            <td>{v.note}</td>
                            <td>{v.commentaire}</td>
                            <td>
                                <button onClick={() => handleEdit(v)}>✏️</button>
                                <button onClick={() => handleDelete(v.id_vote)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                    {votes.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center' }}>
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
