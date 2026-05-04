import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api';

function JuryDashboardPage({ setPage, user, t }) {
    // --- ÉTATS ---
    const [votes, setVotes] = useState([]);
    const [filmsDisponibles, setFilmsDisponibles] = useState([]);
    const [showFilmSelector, setShowFilmSelector] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');

    const [form, setForm] = useState({ id_film: '', note: '', commentaire: '' });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    const isFR = t.nav_home === "Accueil";

    // --- DICTIONNAIRE DE TRADUCTION INTERNE ---
    const txt = {
        title: isFR ? "Console Jury" : "Jury Console",
        selectBtn: isFR ? "CHOISIR UN FILM" : "SELECT MOVIE",
        votesSync: isFR ? "VOTES_SYNCHRONISÉS" : "VOTES_SYNC",
        newVote: isFR ? "NOUVELLE_ÉVALUATION" : "NEW_EVALUATION",
        modVote: isFR ? "MODIFIER_VOTE" : "EDIT_VOTE",
        scoreLabel: isFR ? "NOTE (SUR 10)" : "SCORE (OUT OF 10)",
        analysisLabel: isFR ? "ANALYSE CRITIQUE" : "CRITICAL ANALYSIS",
        saveBtn: isFR ? "ENREGISTRER LE VOTE" : "CONFIRM VOTE",
        updateBtn: isFR ? "METTRE À JOUR" : "UPDATE VOTE",
        historyTitle: isFR ? "ARCHIVES_DES_ÉVALUATIONS" : "VOTING_ARCHIVES",
        watchBtn: isFR ? "Revoir" : "Re-watch",
        viewBtn: isFR ? "Voir" : "View",
        noComment: isFR ? "Aucun commentaire." : "No logs.",
        deleteConfirm: isFR ? "Supprimer ce vote ?" : "Delete this vote?",
        errorUrl: isFR ? "Source vidéo introuvable" : "Video source not found"
    };

    // --- CHARGEMENT DES DONNÉES ---
    const fetchData = async () => {
        if (!user?.id) return;
        try {
            const resVotes = await fetch(`${API_URL}/votes?jury=${user.id}`);
            const dataVotes = await resVotes.json();
            setVotes(dataVotes);

            const resFilms = await fetch(`${API_URL}/films`);
            const dataFilms = await resFilms.json();
            setFilmsDisponibles(dataFilms.filter(f => f.statut_moderation === 'approuve'));
        } catch (err) {
            setError('SYNC_ERROR');
        }
    };

    useEffect(() => { fetchData(); }, [user]);

    // --- LECTEUR VIDÉO (SUPPORT SCALEWAY) ---
    const openVideo = (url) => {
        if (!url) return alert(txt.errorUrl);
        // Si l'URL commence par http (Scaleway), on l'utilise, sinon prefixe local
        const finalUrl = url.startsWith('http') ? url : `http://localhost:8081/${url}`;
        setCurrentVideoUrl(finalUrl);
        setShowVideoModal(true);
    };

    // --- LOGIQUE CRUD ---
    const selectFilm = (film) => {
        setForm({ ...form, id_film: film.id_film });
        setShowFilmSelector(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${API_URL}/votes/${editingId}` : `${API_URL}/votes`;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, id_jury: user.id })
            });
            if (res.ok) {
                setEditingId(null);
                setForm({ id_film: '', note: '', commentaire: '' });
                fetchData();
            }
        } catch { setError('Save Error'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(txt.deleteConfirm)) return;
        await fetch(`${API_URL}/votes/${id}`, { method: 'DELETE' });
        fetchData();
    };

    const handleEdit = (v) => {
        setEditingId(v.id_vote);
        setForm({ id_film: v.id_film, note: v.note, commentaire: v.commentaire || '' });
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    return (
        <div className="soumission-page">
            <header className="page-header-cyber">
                <div className="header-text">
                    <h1>⚖️ {txt.title}</h1>
                    <p className="user-greeting">[LOGGED_AS: {user?.prenom?.toUpperCase()}]</p>
                </div>
                <button className="btn-cyber-exit" onClick={() => setPage('home')}>EXIT ↩</button>
            </header>

            <div className="dashboard-grid-cyber">
                <div className="stat-card-neon btn-trigger" onClick={() => setShowFilmSelector(true)}>
                    <span className="stat-label">{txt.selectBtn}</span>
                    <span className="stat-value">🎬 {filmsDisponibles.length}</span>
                    <div className="stat-bar cyan"></div>
                </div>
                <div className="stat-card-neon">
                    <span className="stat-label">{txt.votesSync}</span>
                    <span className="stat-value">📊 {votes.length}</span>
                    <div className="stat-bar pink"></div>
                </div>
            </div>

            <div className="soumission-grid">
                {/* FORMULAIRE */}
                <form className="form-cyber-card" onSubmit={handleSubmit}>
                    <div className="card-glitch-header"><h3>{editingId ? txt.modVote : txt.newVote}</h3></div>
                    <div className="input-group">
                        <label>FILM_ID</label>
                        <input name="id_film" value={form.id_film} readOnly placeholder="ID..." />
                    </div>
                    <div className="input-group">
                        <label>{txt.scoreLabel}</label>
                        <input name="note" type="number" step="0.1" max="10" value={form.note} onChange={(e)=>setForm({...form, note:e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label>{txt.analysisLabel}</label>
                        <textarea name="commentaire" value={form.commentaire} onChange={(e)=>setForm({...form, commentaire:e.target.value})} rows="3" />
                    </div>
                    <button type="submit" className="btn-submit-neon">
                        {editingId ? txt.updateBtn : txt.saveBtn}
                    </button>
                </form>

                {/* --- HISTORIQUE (GRID CARDS) --- */}
                <div className="history-section-cyber">
                    <div className="card-glitch-header"><h3>{txt.historyTitle}</h3></div>
                    <div className="films-gallery-grid">
                        {votes.map((v) => (
                            <div key={v.id_vote} className="film-card-neon">
                                <div className="card-header-top">
                                    <span className="rating-pill">{v.note}<small>/10</small></span>
                                    <span className="film-id-code">#VOTE-{v.id_vote}</span>
                                </div>
                                <div className="card-main-content">
                                    <h4 className="truncate">{v.film_titre}</h4>
                                    <div className="comment-preview-box">
                                        <span className="text-[9px] text-pink-500 block mb-1 uppercase font-bold tracking-widest">ANALYSIS :</span>
                                        <p className="text-[11px] leading-tight italic text-slate-400 line-clamp-3">
                                            {v.commentaire || txt.noComment}
                                        </p>
                                    </div>
                                </div>
                                <div className="card-actions-footer">
                                    <button onClick={() => openVideo(v.fichier_video)} className="action-btn-cyber view">
                                        <span className="mr-1">👁️</span> {txt.watchBtn}
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(v)} className="action-btn-cyber edit">✏️</button>
                                        <button onClick={() => handleDelete(v.id_vote)} className="action-btn-cyber delete">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL SÉLECTION FILM */}
            {showFilmSelector && (
                <div className="modal-cyber-overlay" onClick={() => setShowFilmSelector(false)}>
                    <div className="form-cyber-card modal-content list-modal" onClick={e => e.stopPropagation()}>
                        <div className="card-glitch-header"><h3>{isFR ? "CHOISIR UN FILM" : "SELECT MOVIE"}</h3></div>
                        <div className="film-selection-list">
                            {filmsDisponibles.map(f => (
                                <div key={f.id_film} className="film-select-item flex justify-between items-center">
                                    <div onClick={() => selectFilm(f)} className="cursor-pointer flex-1">
                                        <span className="f-title">{f.titre}</span>
                                    </div>
                                    <button className="btn-mini-select" onClick={() => openVideo(f.fichier_video)}>
                                        {txt.viewBtn} 👁️
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL LECTEUR VIDÉO */}
            {showVideoModal && (
                <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
                    <div className="modal-content-video" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowVideoModal(false)}>×</button>
                        <video src={currentVideoUrl} controls autoPlay className="cyber-video-player w-full" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default JuryDashboardPage;