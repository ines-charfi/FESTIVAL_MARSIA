import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api';

function FilmsPage({ setPage, t }) {
    const [films, setFilms] = useState([]);
    const [form, setForm] = useState({
        id_realisateur: '',
        titre: '',
        description: '',
        lien_youtube: '',
        duree_secondes: '',
        pays: ''
    });

    // --- ÉTATS POUR LE FORMULAIRE ET LE LECTEUR ---
    const [showForm, setShowForm] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isFR = t.nav_home === "Accueil";

    // --- DICTIONNAIRE DE TRADUCTION ---
    const txt = {
        director: isFR ? "Réalisateur" : "Director",
        status: isFR ? "Statut" : "Status",
        viewBtn: isFR ? "Visionner" : "View",
        approveBtn: isFR ? "Valider" : "Approve",
        rejectBtn: isFR ? "Refuser" : "Reject",
        pending: isFR ? "EN ATTENTE" : "PENDING",
        approved: isFR ? "VALIDÉ" : "APPROVED",
        rejected: isFR ? "REFUSÉ" : "REJECTED",
        confirmDelete: isFR ? "Voulez-vous vraiment supprimer ce film ?" : "Are you sure you want to delete this film?",
        editTitle: isFR ? "Modifier film" : "Edit film",
        cancel: isFR ? "Annuler" : "Cancel",
        save: isFR ? "Enregistrer" : "Save",
        errorVideo: isFR ? "Source vidéo introuvable" : "Video source not found"
    };

    const fetchFilms = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/films`);
            if (!res.ok) throw new Error('Erreur API films');
            const data = await res.json();
            setFilms(data);
        } catch (err) {
            setError(isFR ? 'Impossible de charger les films' : 'Unable to load films');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilms();
    }, []);

    // --- FONCTION POUR VISIONNER (SUPPORT SCALEWAY/LOCAL) ---
    const openVideo = (url) => {
        if (!url) {
            alert(txt.errorVideo);
            return;
        }
        const finalUrl = url.startsWith('http') ? url : `${API_URL.replace('/api', '')}/${url}`;
        setCurrentVideoUrl(finalUrl);
        setShowVideoModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm(txt.confirmDelete)) return;
        try {
            const res = await fetch(`${API_URL}/films/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete error');
            fetchFilms();
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
            if (!res.ok) throw new Error('SQL Error');
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
            if (!res.ok) throw new Error('Update error');
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
                    <h1>🎬 {t.tab_films}</h1>
                    <button className="btn-home" onClick={() => setPage('home')}>← {t.nav_home}</button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>{t.label_title}</th>
                            <th>{txt.director}</th>
                            <th>{txt.status}</th>
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
    <span className={`status-badge status-${f.statut_moderation?.toLowerCase().replace(/\s/g, '-')}`}>
        {/* Le cercle vide ou stylisé par CSS */}
        <div className="status-circle"></div>

        {/* Ton texte de statut actuel */}
        <span className="status-text">
            {f.statut_moderation === 'VALIDE' && txt.approved}
            {f.statut_moderation === 'REFUSE' && txt.rejected}
            {f.statut_moderation === 'EN ATTENTE' && txt.pending}
        </span>
    </span>
                                </td>
                                <td>
                                    <div className="action-group">
                                        {/* BOUTON VISIONNER */}
                                        <button
                                            onClick={() => openVideo(f.fichier_video)}
                                            className="btn-view"
                                            title={txt.viewBtn}
                                        >
                                            👁️ {txt.viewBtn}
                                        </button>

                                        <button onClick={() => updateStatus(f.id_film, 'VALIDE')} className="btn-validate">
                                            {txt.approveBtn}
                                        </button>
                                        <button onClick={() => updateStatus(f.id_film, 'REFUSE')} className="btn-refuse">
                                            {txt.rejectBtn}
                                        </button>
                                        <button onClick={() => handleEdit(f)} className="btn-edit-icon">✏️</button>
                                        <button onClick={() => handleDelete(f.id_film)} className="btn-delete-icon">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* MODAL FORMULAIRE DE MODIFICATION */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>{txt.editTitle} #{editingId}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <label>{t.label_title} *</label>
                                    <input name="titre" value={form.titre} onChange={handleChange} required />
                                </div>
                                <div className="form-row">
                                    <label>{txt.director} ID *</label>
                                    <input name="id_realisateur" type="number" value={form.id_realisateur} onChange={handleChange} required />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? '...' : txt.save}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
                                        {txt.cancel}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL LECTEUR VIDÉO */}
                {showVideoModal && (
                    <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
                        <div className="modal-content-video" onClick={e => e.stopPropagation()}>
                            <button className="close-modal" onClick={() => setShowVideoModal(false)}>×</button>
                            <video
                                src={currentVideoUrl}
                                controls
                                autoPlay
                                className="admin-video-player"
                                style={{ width: '100%', borderRadius: '8px' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FilmsPage;