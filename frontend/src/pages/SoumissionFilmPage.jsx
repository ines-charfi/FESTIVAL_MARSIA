import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function SoumissionFilmPage({ setPage, user }) {
    const [form, setForm] = useState({
        titre: '',
        description: '',
        lien_youtube: '',
        fichier_video: null,
        duree_secondes: '',
        pays: ''
    });
    const [films, setFilms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    // Charge les films du user connecté
    useEffect(() => {
        if (user?.id_utilisateur) {
            fetchFilms();
        }
    }, [user]);

    const fetchFilms = async () => {
        try {
            const res = await fetch(`${API_URL}/films/user/${user.id_utilisateur}`);
            const data = await res.json();
            setFilms(data);
        } catch {
            setError('Erreur chargement films');
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'fichier_video') {
            const file = e.target.files[0];
            if (file && file.size > 500 * 1024 * 1024) { // 500MB max
                setError('Fichier trop volumineux (max 500MB)');
                return;
            }
            setForm((f) => ({ ...f, fichier_video: file }));
            setError('');
        } else {
            setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('id_realisateur', user.id_utilisateur);
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
            const res = await fetch(`${API_URL}/films`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erreur soumission');
            }

            // Reset form
            setForm({
                titre: '',
                description: '',
                lien_youtube: '',
                fichier_video: null,
                duree_secondes: '',
                pays: ''
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchFilms();
            setError('');
        } catch (err) {
            setError(err.message || "Erreur lors de la soumission");
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="page-container">
            {/* HEADER avec boutons navigation */}
            <div className="page-header">
                <div>
                    <h1>🎬 Soumission Film</h1>
                    <p>Bonjour {user?.prenom || 'Réalisateur'} ! Soumettez votre court-métrage IA</p>
                </div>
                <div className="page-actions">
                    {/* 🔗 LIEN VERS BIOGRAPHIE */}
                    <button
                        className="btn-primary"
                        onClick={() => setPage('biographie')}
                    >
                        ✍️ Gérer ma biographie
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => setPage('home')}
                    >
                        ← Accueil
                    </button>
                </div>
            </div>

            {/* 📤 FORMULAIRE SOUMISSION */}
            <form className="card form-large" onSubmit={handleSubmit}>
                <h3>➕ Nouveau film</h3>

                {error && <div className="error-banner">{error}</div>}

                <div className="form-row">
                    <label>Titre *</label>
                    <input
                        name="titre"
                        value={form.titre}
                        onChange={handleChange}
                        required
                        placeholder="Ex: 'IA Dreamscapes'"
                    />
                </div>

                <div className="form-row">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Décrivez votre court-métrage..."
                    />
                </div>

                <div className="form-row">
                    <label>Fichier vidéo (MP4, max 500MB) *</label>
                    <input
                        ref={fileInputRef}
                        name="fichier_video"
                        type="file"
                        accept="video/*,.mp4,.avi,.mov,.mkv"
                        onChange={handleChange}
                        required
                    />
                    {form.fichier_video && (
                        <p className="file-info">
                            📁 {form.fichier_video.name}
                            ({(form.fichier_video.size / 1024 / 1024).toFixed(1)} MB)
                        </p>
                    )}
                </div>

                <div className="form-row">
                    <label>Lien YouTube (optionnel)</label>
                    <input
                        name="lien_youtube"
                        value={form.lien_youtube}
                        onChange={handleChange}
                        placeholder="https://youtube.com/watch?v=..."
                    />
                </div>

                <div className="form-row two-cols">
                    <div>
                        <label>Durée (secondes)</label>
                        <input
                            name="duree_secondes"
                            type="number"
                            min="1"
                            max="1800"
                            value={form.duree_secondes}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Pays</label>
                        <input
                            name="pays"
                            value={form.pays}
                            onChange={handleChange}
                            placeholder="France"
                        />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary btn-large">
                    {loading ? '📤 Soumission en cours...' : '📤 Soumettre mon film'}
                </button>
            </form>

            {/* 📋 MES FILMS SOUMIS */}
            <div className="table-section">
                <h3>Mes films soumis ({films.length})</h3>
                {films.length === 0 ? (
                    <div className="empty-state">
                        <p>Aucun film soumis</p>
                        <p>Soumettez votre premier court-métrage ci-dessus !</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Titre</th>
                                <th>Durée</th>
                                <th>Pays</th>
                                <th>Statut</th>
                            </tr>
                            </thead>
                            <tbody>
                            {films.map((f) => (
                                <tr key={f.id_film}>
                                    <td>#{f.id_film}</td>
                                    <td>{f.titre}</td>
                                    <td>{formatDuration(f.duree_secondes)}</td>
                                    <td>{f.pays}</td>
                                    <td>
                                            <span className={`status-badge status-${f.statut_moderation?.toLowerCase()}`}>
                                                {f.statut_moderation === 'EN_ATTENTE' ? '⏳ En attente' :
                                                    f.statut_moderation === 'VALIDE' ? '✅ Validé' : '❌ Rejeté'}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SoumissionFilmPage;
