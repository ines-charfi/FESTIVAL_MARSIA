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
        <div className="admin-container">
            <div className="admin-header">
                <h2>Gestion des Votes</h2>
                <button className="btn-auth" style={{width: 'auto', padding: '10px 25px'}} onClick={() => setShowForm(true)}>
                    + Créer un Vote
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="table-wrapper">
                <table className="custom-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Film (ID)</th>
                        <th>Jury (ID)</th>
                        <th>Note</th>
                        <th>Commentaire</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {votes.map((v) => (
                        <tr key={v.id_vote}>
                            <td>#{v.id_vote}</td>
                            <td><span className="text-cyan-400">🎬 {v.id_film}</span></td>
                            <td><span className="text-violet-400">⚖️ {v.id_jury}</span></td>
                            <td><span className="admin-note-badge">{v.note}/10</span></td>
                            <td style={{maxWidth: '300px', fontSize: '0.9rem', color: '#94a3b8'}}>
                                {v.commentaire || "Aucun commentaire"}
                            </td>
                            <td>
                                <div className="flex gap-2">
                                    <button className="btn-icon" onClick={() => handleEdit(v)}>✏️</button>
                                    <button className="btn-icon" onClick={() => handleDelete(v.id_vote)}>🗑️</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Formulaire Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="auth-card modal-content">
                        <h3>{editingId ? 'Modifier le vote' : 'Nouveau Vote'}</h3>
                        <form onSubmit={handleSubmit} className="mt-4">
                            <div className="auth-input-group">
                                <input name="id_film" placeholder="ID du Film" value={form.id_film} onChange={handleChange} required />
                            </div>
                            <div className="auth-input-group">
                                <input name="id_jury" placeholder="ID du Jury" value={form.id_jury} onChange={handleChange} required />
                            </div>
                            <div className="auth-input-group">
                                <input name="note" type="number" step="0.1" max="10" placeholder="Note (0-10)" value={form.note} onChange={handleChange} required />
                            </div>
                            <div className="auth-input-group">
                            <textarea
                                name="commentaire"
                                placeholder="Commentaire..."
                                value={form.commentaire}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-violet-500/30 rounded-xl p-3 text-white"
                                rows="3"
                            />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-auth">
                                    {editingId ? 'Mettre à jour' : 'Confirmer'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VotesPage;
