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
    const fileInputRef = useRef(null);

    // Charge les films du user connecté (Solution B: user.id)
    useEffect(() => {
        if (user?.id) {
            fetchFilms();
        }
    }, [user]);

    const fetchFilms = async () => {
        try {
            const res = await fetch(`${API_URL}/films?utilisateurId=${user.id}`);
            if (!res.ok) throw new Error('Erreur chargement films');
            const data = await res.json();
            setFilms(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'fichier_video') {
            setForm((f) => ({ ...f, fichier_video: e.target.files[0] }));
        } else {
            setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        }
    };

    // --- FONCTION VISUALISER ---
    const handleView = (film) => {
        if (film.lien_youtube && film.lien_youtube.includes('http')) {
            window.open(film.lien_youtube, '_blank');
        }
        else if (film.fichier_video) {
            // On s'assure que le chemin correspond à votre serveur statique
            const videoUrl = `http://localhost:8081/${film.fichier_video}`;
            window.open(videoUrl, '_blank');
        }
        else {
            alert("Aucun support visuel disponible.");
        }
    };

    // --- FONCTION SUPPRIMER ---
    const handleDelete = async (id) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce film ?")) return;
        try {
            const res = await fetch(`${API_URL}/films/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Film supprimé avec succès");
                fetchFilms();
            }
        } catch (err) {
            alert("Erreur lors de la suppression");
        }
    };

    // --- SOUMISSION (POST UNIQUEMENT) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('id_realisateur', String(user.id));
        formData.append('titre', form.titre);
        formData.append('description', form.description || '');
        formData.append('lien_youtube', form.lien_youtube || '');
        formData.append('duree_secondes', form.duree_secondes || '0');
        formData.append('pays', form.pays || '');

        if (form.fichier_video) {
            formData.append('fichier_video', form.fichier_video);
        }

        try {
            const res = await fetch(`${API_URL}/films`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Erreur lors de l\'enregistrement');

            alert('🎉 Votre film est  soumis avec succès. Il est en attente de validation');

            // Reset du formulaire
            setForm({ titre: '', description: '', lien_youtube: '', fichier_video: null, duree_secondes: '', pays: '' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchFilms();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>🎬 Soumission Film</h1>
                    <p>Bonjour {user?.prenom} ! Partagez vos créations avec le festival.</p>
                </div>
                <div className="page-actions">
                    <button className="btn-primary" onClick={() => setPage('biographie')}>✍️ Ma Biographie</button>
                    <button className="btn-secondary" onClick={() => setPage('home')}>← Accueil</button>
                </div>
            </div>

            {/* FORMULAIRE DE NOUVEAU FILM */}
            <form className="card form-large" onSubmit={handleSubmit}>
                <h3>➕ Nouveau film</h3>
                {error && <div className="error-banner">{error}</div>}

                <div className="form-row">
                    <label>Titre *</label>
                    <input name="titre" value={form.titre} onChange={handleChange} required placeholder="Titre du film" />
                </div>

                <div className="form-row">
                    <label>Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Résumé du court-métrage..." />
                </div>

                <div className="form-row">
                    <label>Fichier vidéo *</label>
                    <input ref={fileInputRef} name="fichier_video" type="file" onChange={handleChange} required />
                </div>

                <div className="form-row two-cols">
                    <div>
                        <label>Durée (sec)</label>
                        <input name="duree_secondes" type="number" value={form.duree_secondes} onChange={handleChange} />
                    </div>
                    <div>
                        <label>Pays</label>
                        <input name="pays" value={form.pays} onChange={handleChange} placeholder="Ex: France" />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary btn-large">
                    {loading ? 'Envoi en cours...' : '🚀 Soumettre mon film'}
                </button>
            </form>

            {/* TABLEAU DES FILMS */}
            <div className="table-section">
                <h3>Mes films soumis ({films.length})</h3>
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Titre</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {films.map((f) => (
                            <tr key={f.id_film}>
                                <td>#{f.id_film}</td>
                                <td>{f.titre}</td>
                                <td>
                                        <span className={`status-badge status-${f.statut_moderation?.toLowerCase().replace(' ', '-')}`}>
                                            {f.statut_moderation}
                                        </span>
                                </td>
                                <td>
                                    <button onClick={() => handleView(f)} className="btn-view-icon" title="Visualiser">👁️</button>
                                    <button onClick={() => handleDelete(f.id_film)} className="btn-delete-icon" title="Supprimer">🗑️</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {films.length === 0 && <p className="empty-msg">Vous n'avez pas encore soumis de film.</p>}
                </div>
            </div>
        </div>
    );
}

export default SoumissionFilmPage;