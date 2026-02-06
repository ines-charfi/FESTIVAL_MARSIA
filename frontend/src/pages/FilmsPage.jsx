import React, { useEffect, useState, useRef } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function FilmsPage({ setPage }) {
    const [films, setFilms] = useState([]);
    const [form, setForm] = useState({
        id_realisateur: '',
        titre: '',
        description: '',
        lien_youtube: '',
        duree_secondes: '',
        pays: '',
        fichier_video: null
    });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // 🔹 Récupérer les films
    const fetchFilms = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/films`);
            if (!res.ok) throw new Error('Erreur API films');
            const data = await res.json();
            setFilms(data);
        } catch (err) {
            console.error(err);
            setError('Impossible de charger les films');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilms();
    }, []);

    // 🔹 Modifier le formulaire
    const handleChange = (e) => {
        if (e.target.name === 'fichier_video') {
            const file = e.target.files[0];
            if (file && file.size > 500 * 1024 * 1024) {
                setError('Fichier trop volumineux (max 500MB)');
                return;
            }
            setForm((f) => ({ ...f, fichier_video: file }));
        } else {
            setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        }
    };

    // 🔹 Submit modification film
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/films/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_realisateur: Number(form.id_realisateur),
                    titre: form.titre,
                    description: form.description,
                    lien_youtube: form.lien_youtube,
                    duree_secondes: Number(form.duree_secondes) || null,
                    pays: form.pays
                })
            });

            if (!res.ok) throw new Error('Erreur mise à jour');

            setShowForm(false);
            setEditingId(null);
            fetchFilms();
        } catch (err) {
            console.error(err);
            setError('Erreur lors de la modification du film');
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Ouvrir modal modification
    const handleEdit = (film) => {
        setEditingId(film.id_film);
        setForm({
            id_realisateur: film.id_realisateur || '',
            titre: film.titre || '',
            description: film.description || '',
            lien_youtube: film.lien_youtube || '',
            duree_secondes: film.duree_secondes || '',
            pays: film.pays || '',
            fichier_video: null
        });
        setShowForm(true);
    };

    // 🔹 Supprimer film
    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce film ?')) return;
        try {
            const res = await fetch(`${API_URL}/films/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            fetchFilms();
        } catch {
            setError('Erreur lors de la suppression');
        }
    };

    // 🔹 Valider / Refuser film
    const updateStatus = async (id_film, statut) => {
        try {
            const res = await fetch(`${API_URL}/films/${id_film}/validation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statut_moderation: statut })
            });
            if (!res.ok) throw new Error('Erreur validation film');
            fetchFilms();
        } catch (err) {
            console.error(err);
            setError('Erreur lors de la validation du film');
        }
    };

    // 🔹 Format durée
    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="admin-layout">
            <div className="admin-content">
                <div className="page-header">
                    <div>
                        <h1>🎬 Gestion Films</h1>
                        <p>{films.length} films ({films.filter(f => f.statut_moderation === 'EN_ATTENTE').length} en attente)</p>
                    </div>
                    <div className="page-actions">
                        <button className="btn-home" onClick={() => setPage('home')}>
                            ← Accueil
                        </button>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-section">
                    <h3>Liste des films ({films.length})</h3>
                    {loading ? (
                        <div className="loading">Chargement...</div>
                    ) : films.length === 0 ? (
                        <div className="empty-state">
                            <p>Aucun film</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Titre</th>
                                    <th>Réalisateur</th>
                                    <th>Pays</th>
                                    <th>Durée</th>
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
                                        <td>{f.pays || 'N/A'}</td>
                                        <td>{formatDuration(f.duree_secondes)}</td>
                                        <td>
                                                <span className={`status-badge status-${f.statut_moderation?.toLowerCase()}`}>
                                                    {f.statut_moderation || 'en attente'}
                                                </span>
                                        </td>
                                        <td>
                                            <button onClick={() => updateStatus(f.id_film, 'VALIDE')} className="btn-validate">Valider</button>
                                            <button onClick={() => updateStatus(f.id_film, 'REFUSE')} className="btn-refuse">Refuser</button>
                                            <button onClick={() => handleEdit(f)} className="btn-edit">✏️</button>
                                            <button onClick={() => handleDelete(f.id_film)} className="btn-delete">🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODAL MODIFIER */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>✏️ Modifier film #{editingId}</h3>
                                <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                {error && <div className="error">{error}</div>}

                                <div className="form-row">
                                    <label>ID Réalisateur *</label>
                                    <input name="id_realisateur" type="number" value={form.id_realisateur} onChange={handleChange} required />
                                </div>
                                <div className="form-row">
                                    <label>Titre *</label>
                                    <input name="titre" value={form.titre} onChange={handleChange} required />
                                </div>
                                <div className="form-row">
                                    <label>Description</label>
                                    <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
                                </div>
                                <div className="form-row">
                                    <label>Lien YouTube</label>
                                    <input name="lien_youtube" value={form.lien_youtube} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." />
                                </div>
                                <div className="form-row">
                                    <label>Durée (secondes)</label>
                                    <input name="duree_secondes" type="number" value={form.duree_secondes} onChange={handleChange} />
                                </div>
                                <div className="form-row">
                                    <label>Pays</label>
                                    <input name="pays" value={form.pays} onChange={handleChange} />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? '📤 Mise à jour...' : 'Mettre à jour film'}
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
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
