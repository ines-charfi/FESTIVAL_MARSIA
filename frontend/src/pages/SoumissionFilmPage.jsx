import React, { useState, useRef } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function SoumissionFilmPage({ setPage }) {
    const [form, setForm] = useState({
        id_realisateur: '', // Sera récupéré depuis user connecté
        titre: '',
        description: '',
        lien_youtube: '',
        duree_secondes: '',
        pays: '',
        fichier_video: null
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

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
        formData.append('id_realisateur', form.id_realisateur || 1); // À adapter avec user connecté
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
                body: formData,
            });
            if (!res.ok) throw new Error('Erreur soumission');

            // Succès
            alert('🎬 Film soumis avec succès ! Il sera examiné par l\'admin.');
            setForm({
                id_realisateur: '',
                titre: '',
                description: '',
                lien_youtube: '',
                duree_secondes: '',
                pays: '',
                fichier_video: null
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            setPage('home'); // Redirige vers home
        } catch (err) {
            setError("Erreur lors de la soumission du film");
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>🎬 Soumission Film</h1>
                <button onClick={() => setPage('home')} className="btn-back">← Retour</button>
            </div>

            <div className="card">
                <h2>Soumettre votre court-métrage IA</h2>
                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>ID Réalisateur *</label>
                        <input
                            name="id_realisateur"
                            type="number"
                            value={form.id_realisateur}
                            onChange={handleChange}
                            placeholder="Votre ID utilisateur (à pré-remplir)"
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
                            rows="4"
                            placeholder="Décrivez votre court-métrage IA..."
                        />
                    </div>

                    {/* 🎥 UPLOAD VIDÉO */}
                    <div className="form-row">
                        <label>Fichier Vidéo (MP4, max 500MB) *</label>
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
                        {uploadProgress > 0 && (
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
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

                    <div className="form-row">
                        <label>Durée (secondes)</label>
                        <input
                            name="duree_secondes"
                            type="number"
                            value={form.duree_secondes}
                            onChange={handleChange}
                            placeholder="180"
                        />
                        <small>ex: 180 pour 3 minutes</small>
                    </div>

                    <div className="form-row">
                        <label>Pays</label>
                        <input
                            name="pays"
                            value={form.pays}
                            onChange={handleChange}
                            placeholder="France"
                        />
                    </div>

                    <button type="submit" className="btn-primary btn-large" disabled={loading}>
                        {loading ? '📤 Soumission en cours...' : '📤 Soumettre mon film'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SoumissionFilmPage;
