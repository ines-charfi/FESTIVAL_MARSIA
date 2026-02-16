import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function FilmsPage({ setPage }) {
    const [films, setFilms] = useState([]);
    const [form, setForm] = useState({
        id_realisateur: '',
        titre: '',
        description: '',
        lien_youtube: '',
        duree_secondes: '',
        pays: ''
    });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchFilms = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/films`);
            if (!res.ok) throw new Error('Erreur API films');
            const data = await res.json();
            setFilms(data);
        } catch (err) {
            setError('Impossible de charger les films');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilms();
    }, []);

    // 🔹 Fonction Supprimer
    const handleDelete = async (id) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce film ?")) return;
        try {
            const res = await fetch(`${API_URL}/films/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Erreur lors de la suppression');
            fetchFilms(); // Rafraîchir la liste
        } catch (err) {
            setError(err.message);
        }
    };

    const updateStatus = async (id_film, statut) => {
        try {
            const res = await fetch(`${API_URL}/films/${id_film}/validation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statut_moderation: statut.toUpperCase() })

            });
            if (!res.ok) throw new Error('Erreur SQL');
            fetchFilms();
        } catch (err) {
            setError(`Erreur: ${err.message}`);
        }
    };

    const handleEdit = (film) => {
        setEditingId(film.id_film);
        setForm({
            id_realisateur: film.id_realisateur || '',
            titre: film.titre || '',
            description: film.description || '',
            lien_youtube: film.lien_youtube || '',
            duree_secondes: film.duree_secondes || '',
            pays: film.pays || ''
        });
        setShowForm(true);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/films/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    id_realisateur: Number(form.id_realisateur)
                })
            });
            if (!res.ok) throw new Error('Erreur mise à jour');
            setShowForm(false);
            fetchFilms();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-layout">
            <div className="admin-content">
                <div className="page-header">
                    <h1>🎬 Gestion Films</h1>
                    <button className="btn-home" onClick={() => setPage('home')}>← Accueil</button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Titre</th>
                            <th>Réalisateur</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {films.map(f => (
                            <tr key={f.id_film}>
                                <td>#{f.id_film}</td>
                                <td>{f.titre}</td>
                                <td>#{f.id_realisateur}</td>
                                <td>
                                    <span className={`status-badge status-${f.statut_moderation?.replace(' ', '-')}`}>
                                        {f.statut_moderation}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-group">
                                        <button onClick={() => updateStatus(f.id_film, 'VALIDE')} className="btn-validate">Valider</button>
                                        <button onClick={() => updateStatus(f.id_film, 'REFUSE')} className="btn-refuse">Refuser</button>
                                        <button onClick={() => handleEdit(f)} className="btn-edit-icon" title="Modifier">✏️</button>
                                        <button onClick={() => handleDelete(f.id_film)} className="btn-delete-icon" title="Supprimer">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* MODAL MODIFIER (Inchangé) */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Modifier film #{editingId}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <label>Titre *</label>
                                    <input name="titre" value={form.titre} onChange={handleChange} required />
                                </div>
                                <div className="form-row">
                                    <label>ID Réalisateur *</label>
                                    <input name="id_realisateur" type="number" value={form.id_realisateur} onChange={handleChange} required />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)}>Annuler</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FilmsPage;