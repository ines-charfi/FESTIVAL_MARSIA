import React, { useState, useEffect, useRef } from 'react';

// URL du backend
const API_URL = 'http://localhost:8081/api';

function SoumissionFilmPage({ setPage, user, t }) {
    // --- ÉTATS ---
    const [form, setForm] = useState({
        titre: '',
        description: '',
        fichier_video: null,
        email: user?.email || '',
        pays: ''
    });

    const [films, setFilms] = useState([]);
    const [outilsDisponibles, setOutilsDisponibles] = useState([]);
    const [outilsSelectionnes, setOutilsSelectionnes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null); // ID du film en cours de modification

    // ÉTATS POUR LE LECTEUR VIDÉO
    const [showModal, setShowModal] = useState(false);
    const [currentVideo, setCurrentVideo] = useState('');

    const fileInputRef = useRef(null);
    const isFR = t.nav_home === "Accueil";

    const statusMap = {
        'en attente': isFR ? 'En attente' : 'Pending',
        'approuve': isFR ? 'Approuvé' : 'Approved',
        'rejete': isFR ? 'Rejeté' : 'Rejected'
    };

    // --- CHARGEMENT DES DONNÉES ---
    useEffect(() => {
        fetchOutilsIA();
        if (user?.id) {
            fetchFilms();
        }
    }, [user]);

    const fetchFilms = async () => {
        try {
            const res = await fetch(`${API_URL}/films?utilisateurId=${user.id}`);
            if (!res.ok) throw new Error('Erreur chargement');
            const data = await res.json();
            setFilms(data);
        } catch (err) { console.error(err.message); }
    };

    const fetchOutilsIA = async () => {
        try {
            const res = await fetch(`${API_URL}/outils-ia`);
            if (!res.ok) throw new Error('Impossible de charger les outils IA');
            const data = await res.json();
            setOutilsDisponibles(data);
        } catch (err) {
            setOutilsDisponibles([
                {id_outil: 1, nom_outil: "Runway Gen-2"},
                {id_outil: 2, nom_outil: "Pika Labs"},
                {id_outil: 3, nom_outil: "Sora"}
            ]);
        }
    };

    // --- ACTIONS : SUPPRIMER & MODIFIER ---

    const handleDelete = async (id) => {
        const confirmMsg = isFR ? "⚠️ Confirmer la suppression définitive ?" : "⚠️ Confirm permanent deletion?";
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await fetch(`${API_URL}/films/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Erreur lors de la suppression");

            alert(isFR ? "✅ Archive supprimée." : "✅ Archive deleted.");
            fetchFilms();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEdit = (film) => {
        setEditingId(film.id_film);
        setForm({
            titre: film.titre || '',
            description: film.description || '',
            fichier_video: null, // On ne peut pas pré-remplir un input file
            email: film.email || user?.email || '',
            pays: film.pays || ''
        });
        // Scroll vers le formulaire pour que l'utilisateur voit qu'il modifie
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm({ titre: '', description: '', fichier_video: null, email: user?.email || '', pays: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- GESTION DU FORMULAIRE ---
    const handleAddOutil = (e) => {
        const id = parseInt(e.target.value);
        if (!id || outilsSelectionnes.find(o => o.id_outil === id)) return;
        const outil = outilsDisponibles.find(opt => opt.id_outil === id);
        setOutilsSelectionnes([...outilsSelectionnes, { id_outil: id, nom: outil.nom_outil, version: '1.0' }]);
    };

    const handleRemoveOutil = (id) => {
        setOutilsSelectionnes(outilsSelectionnes.filter(o => o.id_outil !== id));
    };

    const handleChange = (e) => {
        if (e.target.name === 'fichier_video') {
            setForm((f) => ({ ...f, fichier_video: e.target.files[0] }));
        } else {
            setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        if (form.fichier_video) formData.append('video', form.fichier_video);
        formData.append('titre', form.titre);
        formData.append('description', form.description || '');
        formData.append('email', form.email);
        formData.append('pays', form.pays || '');
        formData.append('outils', JSON.stringify(outilsSelectionnes));

        // Champs requis par ton backend PUT
        if (user?.id) formData.append('id_realisateur', String(user.id));
        formData.append('lien_youtube', '');
        formData.append('duree_secondes', '0');

        try {
            const url = editingId ? `${API_URL}/films/${editingId}` : `${API_URL}/upload`;
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, { method, body: formData });
            const result = await res.json();

            if (!res.ok) throw new Error(result.error || result.message || "Erreur serveur");

            alert(isFR ? '🚀 Opération réussie !' : '🚀 Operation successful!');
            handleCancelEdit(); // Reset form et editingId
            fetchFilms();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenVideo = (url) => {
        setCurrentVideo(url);
        setShowModal(true);
    };

    return (
        <div className="soumission-page">
            <div className="page-header-cyber">
                <div className="header-text">
                    <h1>🎬 {isFR ? "Module de Déploiement" : "Deployment Module"}</h1>
                    <p className="user-greeting">
                        {user ? `[${user.prenom?.toUpperCase()} // AUTHORIZED]` : "[GUEST_MODE]"}
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn-cyber-exit" onClick={() => setPage('home')}>
                        {t.nav_home.toUpperCase()} ↩
                    </button>
                </div>
            </div>

            <div className="soumission-grid">
                {/* FORMULAIRE */}
                <form className="form-cyber-card" onSubmit={handleSubmit}>
                    <div className="card-glitch-header">
                        <h3>{editingId ? (isFR ? "MODIFIER_ARCHIVE" : "EDIT_ARCHIVE") : (isFR ? "NOUVELLE_ENTRÉE" : "NEW_ENTRY")}</h3>
                    </div>

                    {error && <div className="error-banner-neon">{error}</div>}

                    <div className="input-group">
                        <label>{isFR ? "Titre de l'œuvre *" : "Work Title *"}</label>
                        <input name="titre" value={form.titre} onChange={handleChange} required placeholder="SYSTEM_NAME..." />
                    </div>

                    <div className="input-group">
                        <label>{isFR ? "Outils IA utilisés" : "AI Tools"}</label>
                        <div className="tool-selector-cyber">
                            <select onChange={handleAddOutil} value="">
                                <option value="">-- SELECT_TOOL --</option>
                                {outilsDisponibles.map(o => (
                                    <option key={o.id_outil} value={o.id_outil}>{o.nom_outil}</option>
                                ))}
                            </select>
                            <div className="selected-tools-list">
                                {outilsSelectionnes.map(o => (
                                    <div key={o.id_outil} className="tool-tag-cyber">
                                        <span>{o.nom}</span>
                                        <button type="button" onClick={() => handleRemoveOutil(o.id_outil)}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>{isFR ? "Fichier Vidéo" : "Video File"} {editingId && "(Optionnel)"}</label>
                        <input ref={fileInputRef} name="fichier_video" type="file" accept="video/*" onChange={handleChange} required={!editingId} />
                    </div>

                    <div className="input-group">
                        <label>{isFR ? "Email de contact *" : "Contact Email *"}</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required />
                    </div>

                    <div className="form-actions-cyber">
                        <button type="submit" disabled={loading} className="btn-submit-neon">
                            {loading ? 'SYNCING...' : (editingId ? (isFR ? 'METTRE À JOUR' : 'UPDATE') : (isFR ? 'DÉPLOYER' : 'DEPLOY'))}
                        </button>

                        {editingId && (
                            <button type="button" onClick={handleCancelEdit} className="btn-cancel-cyber">
                                {isFR ? "ANNULER" : "CANCEL"}
                            </button>
                        )}
                    </div>
                </form>

                {/* HISTORIQUE / GALLERIE */}
                <div className="history-section-cyber">
                    <div className="card-glitch-header">
                        <h3>{isFR ? "ARCHIVES_DES_DÉPLOIEMENTS" : "DEPLOYMENT_ARCHIVES"}</h3>
                    </div>

                    <div className="films-gallery-grid">
                        {user ? (
                            films.length > 0 ? (
                                films.map((f) => (
                                    <div key={f.id_film} className="film-card-neon">
                                        <div className="card-header-top">
                                            <span className={`status-tag status-${f.statut_moderation?.toLowerCase().replace(/\s/g, '-')}`}>
                                                {statusMap[f.statut_moderation] || f.statut_moderation}
                                            </span>
                                            <span className="film-id-code">#ID-{f.id_film}</span>
                                        </div>

                                        <div className="card-main-content">
                                            <h4>{f.titre}</h4>
                                            <p className="submission-date">
                                                {new Date(f.date_soumission).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="card-actions-footer">
                                            <button onClick={() => handleOpenVideo(f.fichier_video)} className="action-btn-cyber view">👁️</button>
                                            <button onClick={() => handleEdit(f)} className="action-btn-cyber edit">✏️</button>
                                            <button onClick={() => handleDelete(f.id_film)} className="action-btn-cyber delete">🗑️</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">NO_DATA_FOUND</p>
                            )
                        ) : (
                            <p className="empty-state italic">AUTH_REQUIRED</p>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL LECTEUR */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content-video" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
                        <video src={currentVideo} controls autoPlay className="cyber-video-player" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default SoumissionFilmPage;