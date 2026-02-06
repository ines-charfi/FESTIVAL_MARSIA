import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1/votes';

function VotesPage({ setPage }) {
    const [votes, setVotes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        id_film: '',
        id_jury: '',
        note: '',
        commentaire: '',
    });

    // 🔹 GET tous les votes
    const fetchVotes = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setVotes(data);
        } catch {
            setError('Impossible de charger les votes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVotes();
    }, []);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    // 🔹 POST / PUT
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            id_film: Number(form.id_film),
            id_jury: Number(form.id_jury),
            note: Number(form.note),
            commentaire: form.commentaire,
        };

        try {
            setLoading(true);

            if (editingId) {
                // ✏️ UPDATE
                await fetch(`${API_URL}/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                // ➕ CREATE
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            setForm({ id_film: '', id_jury: '', note: '', commentaire: '' });
            setEditingId(null);
            setShowForm(false);
            fetchVotes();
        } catch {
            setError('Erreur lors de l’enregistrement');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (vote) => {
        setEditingId(vote.id_vote);
        setForm({
            id_film: vote.id_film,
            id_jury: vote.id_jury,
            note: vote.note,
            commentaire: vote.commentaire || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce vote ?')) return;
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchVotes();
        } catch {
            setError('Erreur suppression');
        }
    };

    return (
        <div className="admin-layout">
            <div className="admin-content">

                <div className="page-header">
                    <div>
                        <h1>🗳️ Gestion des votes</h1>
                        <p>{votes.length} votes enregistrés</p>
                    </div>

                    <div className="page-actions">
                        <button className="btn-home" onClick={() => setPage('home')}>
                            ← Accueil
                        </button>

                        <button
                            className="btn-primary"
                            onClick={() => {
                                setEditingId(null);
                                setForm({
                                    id_film: '',
                                    id_jury: '',
                                    note: '',
                                    commentaire: '',
                                });
                                setShowForm(true);
                            }}
                        >
                            ➕ Ajouter un vote
                        </button>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Film</th>
                            <th>Jury</th>
                            <th>Note</th>
                            <th>Commentaire</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {votes.map((v) => (
                            <tr key={v.id_vote}>
                                <td>#{v.id_vote}</td>
                                <td>{v.film_titre}</td>
                                <td>{v.jury_prenom} {v.jury_nom}</td>
                                <td>{v.note}/10</td>
                                <td>{v.commentaire}</td>
                                <td>
                                    <button onClick={() => handleEdit(v)}>✏️</button>
                                    <button onClick={() => handleDelete(v.id_vote)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>
                                {editingId
                                    ? `✏️ Modifier vote #${editingId}`
                                    : '➕ Ajouter un vote'}
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <input
                                    name="id_film"
                                    type="number"
                                    placeholder="ID Film"
                                    value={form.id_film}
                                    onChange={handleChange}
                                    required
                                />

                                <input
                                    name="id_jury"
                                    type="number"
                                    placeholder="ID Jury"
                                    value={form.id_jury}
                                    onChange={handleChange}
                                    required
                                />

                                <input
                                    name="note"
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    placeholder="Note"
                                    value={form.note}
                                    onChange={handleChange}
                                    required
                                />

                                <textarea
                                    name="commentaire"
                                    placeholder="Commentaire"
                                    value={form.commentaire}
                                    onChange={handleChange}
                                />

                                <button type="submit">
                                    {editingId ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default VotesPage;
