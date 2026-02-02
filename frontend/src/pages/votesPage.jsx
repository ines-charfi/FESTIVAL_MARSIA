import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function VotesPage({ setPage }) {
    const [votes, setVotes] = useState([]);
    const [form, setForm] = useState({
        id_film: '',
        id_jury: '',
        note: '',
        commentaire: '',
    });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchVotes = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/votes`);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            ...form,
            id_film: Number(form.id_film),
            id_jury: Number(form.id_jury),
            note: Number(form.note),
        };

        try {
            setLoading(true);
            // UNIQUEMENT UPDATE (pas de création)
            await fetch(`${API_URL}/votes/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            setForm({ id_film: '', id_jury: '', note: '', commentaire: '' });
            setEditingId(null);
            setShowForm(false);
            fetchVotes();
        } catch {
            setError('Erreur lors de la modification');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (vote) => {
        setEditingId(vote.id_vote);
        setForm({
            id_film: vote.id_film || '',
            id_jury: vote.id_jury || '',
            note: vote.note || '',
            commentaire: vote.commentaire || '',
        });
        setShowForm(true);
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
        <div className="admin-layout">


            {/* 📊 CONTENU */}
            <div className="admin-content">
                <div className="page-header">
                    <div>
                        <h1>🗳️ Gestion Votes</h1>
                        <p>{votes.length} votes enregistrés</p>
                    </div>
                    <div className="page-actions">
                        {/* ❌ PAS DE BOUTON ➕ */}
                        <button className="btn-home" onClick={() => setPage('home')}>
                            ← Accueil
                        </button>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-section">
                    <h3>Liste des votes ({votes.length})</h3>
                    {loading ? (
                        <div className="loading">Chargement...</div>
                    ) : votes.length === 0 ? (
                        <div className="empty-state">
                            <p>Aucun vote enregistré</p>
                            <p>Les jurés soumettent leurs votes depuis leur dashboard</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Film</th>
                                    <th>Jury</th>
                                    <th>Note</th>
                                    <th>Commentaire</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {votes.map((v) => (
                                    <tr key={v.id_vote}>
                                        <td>#{v.id_vote}</td>
                                        <td>#F{v.id_film}</td>
                                        <td>#J{v.id_jury}</td>
                                        <td>
                                                <span className={`note-badge note-${Math.round(v.note)}`}>
                                                    {v.note}/10
                                                </span>
                                        </td>
                                        <td>{v.commentaire?.substring(0, 40)}${v.commentaire?.length > 40 ? '...' : ''}</td>
                                        <td>{v.date_vote ? new Date(v.date_vote).toLocaleDateString('fr-FR') : '-'}</td>
                                        <td>
                                            <button className="btn-edit" onClick={() => handleEdit(v)} title="Modifier">
                                                ✏️
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDelete(v.id_vote)} title="Supprimer">
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 🆕 MODAL MODIFIER UNIQUEMENT */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>✏️ Modifier vote #{editingId}</h3>
                                <button className="modal-close" onClick={() => setShowForm(false)}>
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                {error && <div className="error">{error}</div>}

                                <div className="form-row">
                                    <label>ID Film *</label>
                                    <input
                                        name="id_film"
                                        type="number"
                                        value={form.id_film}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <label>ID Jury *</label>
                                    <input
                                        name="id_jury"
                                        type="number"
                                        value={form.id_jury}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <label>Note (0-10) *</label>
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
                                        rows="3"
                                        placeholder="Commentaire optionnel..."
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? '...' : 'Mettre à jour vote'}
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
        </div>
    );
}

export default VotesPage;
