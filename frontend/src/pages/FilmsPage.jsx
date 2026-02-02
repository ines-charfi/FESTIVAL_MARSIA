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
    const [showForm, setShowForm] = useState(false); // 🆕 Modal fermé
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const fetchFilms = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/films`);
            const data = await res.json();
            setFilms(data);
        } catch (e) {
            setError('Impossible de charger les films');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilms();
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('id_realisateur', Number(form.id_realisateur) || null);
        formData.append('titre', form.titre);
        formData.append('description', form.description);
        formData.append('lien_youtube', form.lien_youtube);
        formData.append('duree_secondes', Number(form.duree_secondes) || null);
        formData.append('pays', form.pays);
        if (form.fichier_video) {
            formData.append('fichier_video', form.fichier_video);
        }

        try {
            setLoading(true);
            // ❌ UNIQUEMENT UPDATE (pas de création)
            formData.append('id_film', editingId);
            const res = await fetch(`${API_URL}/films/${editingId}`, {
                method: 'PUT',
                body: formData,
            });
            if (!res.ok) throw new Error('Erreur mise à jour');

            setForm({
                id_realisateur: '',
                titre: '',
                description: '',
                lien_youtube: '',
                duree_secondes: '',
                pays: '',
                fichier_video: null
            });
            setEditingId(null);
            setShowForm(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchFilms();
        } catch (err) {
            setError("Erreur lors de la modification du film");
        } finally {
            setLoading(false);
            setUploadProgress(0);
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
            pays: film.pays || '',
            fichier_video: null
        });
        setShowForm(true); // 🆕 Ouvre modal
    };

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

    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="admin-layout">

            {/* 📊 CONTENU */}
            <div className="admin-content">
                <div className="page-header">
                    <div>
                        <h1>🎬 Gestion Films</h1>
                        <p>{films.length} films ({films.filter(f => f.statut_moderation === 'EN_ATTENTE').length} en attente)</p>
                    </div>
                    <div className="page-actions">
                        {/* ❌ PAS DE ➕ CRÉATION */}
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
                            <p>Les réalisateurs soumettent via la page Soumission</p>
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
                                {films.map((f) => (
                                    <tr key={f.id_film}>
                                        <td>#{f.id_film}</td>
                                        <td><strong>{f.titre}</strong></td>
                                        <td>#{f.id_realisateur}</td>
                                        <td>{f.pays || 'N/A'}</td>
                                        <td>{formatDuration(f.duree_secondes)}</td>
                                        <td>
                                                <span className={`status-badge status-${f.statut_moderation?.toLowerCase()}`}>
                                                    {f.statut_moderation || 'EN_ATTENTE'}
                                                </span>
                                        </td>
                                        <td>
                                            <button className="btn-edit" onClick={() => handleEdit(f)} title="Modifier">
                                                ✏️
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDelete(f.id_film)} title="Supprimer">
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
                                <h3>✏️ Modifier film #{editingId}</h3>
                                <button className="modal-close" onClick={() => setShowForm(false)}>
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                {error && <div className="error">{error}</div>}

                                <div className="form-row">
                                    <label>ID Réalisateur *</label>
                                    <input
                                        name="id_realisateur"
                                        type="number"
                                        value={form.id_realisateur}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <label>Titre *</label>
                                    <input
                                        name="titre"
                                        value={form.titre}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-row">
                                    <label>Nouveau fichier vidéo (optionnel)</label>
                                    <input
                                        ref={fileInputRef}
                                        name="fichier_video"
                                        type="file"
                                        accept="video/*,.mp4,.avi,.mov,.mkv"
                                        onChange={handleChange}
                                    />
                                    {form.fichier_video && (
                                        <p className="file-info">
                                            📁 {form.fichier_video.name} ({(form.fichier_video.size / 1024 / 1024).toFixed(1)} MB)
                                        </p>
                                    )}
                                </div>

                                <div className="form-row">
                                    <label>Lien YouTube</label>
                                    <input
                                        name="lien_youtube"
                                        value={form.lien_youtube}
                                        onChange={handleChange}
                                        placeholder="https://youtube.com/watch?v=..."
                                    />
                                </div>

                                <div className="form-row">
                                    <label>Durée (secondes)</label>
                                    <input
                                        name="duree_secondes"
                                        type="number"
                                        value={form.duree_secondes}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-row">
                                    <label>Pays</label>
                                    <input name="pays" value={form.pays} onChange={handleChange} />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? '📤 Mise à jour...' : 'Mettre à jour film'}
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

export default FilmsPage;
