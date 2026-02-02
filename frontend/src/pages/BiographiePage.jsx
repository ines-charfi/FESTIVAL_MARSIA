import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function BiographiePage({ setPage, user }) {
    const [bio, setBio] = useState({
        nom: '',
        prenom: '',
        biographie: '',
        photo_profil: null,
        lien_site: '',
        reseaux_sociaux: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Charge bio du user connecté
    useEffect(() => {
        if (user?.id_utilisateur) {
            fetch(`${API_URL}/biographie/${user.id_utilisateur}`)
                .then(res => res.json())
                .then(data => setBio(data))
                .catch(() => setError('Erreur chargement bio'));
        }
    }, [user]);

    const handleChange = (e) => {
        if (e.target.name === 'photo_profil') {
            setBio(b => ({ ...b, photo_profil: e.target.files[0] }));
        } else {
            setBio(b => ({ ...b, [e.target.name]: e.target.value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('id_utilisateur', user.id_utilisateur);
        formData.append('nom', bio.nom);
        formData.append('prenom', bio.prenom);
        formData.append('biographie', bio.biographie);
        formData.append('lien_site', bio.lien_site);
        formData.append('reseaux_sociaux', bio.reseaux_sociaux);
        if (bio.photo_profil) formData.append('photo_profil', bio.photo_profil);

        try {
            setLoading(true);
            await fetch(`${API_URL}/biographie`, {
                method: 'POST',
                body: formData
            });
            setError('');
        } catch {
            setError('Erreur sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>✍️ Ma Biographie</h1>
                <div className="page-actions">
                    <button className="btn-primary" onClick={() => setPage('soumission-film')}>
                        🎬 Soumission Film
                    </button>
                    <button className="btn-home" onClick={() => setPage('home')}>
                        ← Accueil
                    </button>
                </div>
            </div>

            {/* 👤 PRÉVIEW BIO */}
            <div className="bio-preview card">
                <img
                    src={bio.photo_profil || '/default-avatar.png'}
                    alt="Photo"
                    className="bio-photo"
                />
                <h3>{bio.prenom} {bio.nom}</h3>
                <p>{bio.biographie || 'Aucune biographie'}</p>
                <div className="bio-links">
                    {bio.lien_site && <a href={bio.lien_site}>🌐 Site</a>}
                    {bio.reseaux_sociaux && <a href={bio.reseaux_sociaux}>📱 Réseaux</a>}
                </div>
            </div>

            {/* ✏️ FORMULAIRE */}
            <form onSubmit={handleSubmit} className="card">
                <h3>Modifier ma bio</h3>

                <div className="form-row">
                    <label>Nom</label>
                    <input name="nom" value={bio.nom} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Prénom</label>
                    <input name="prenom" value={bio.prenom} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Biographie</label>
                    <textarea
                        name="biographie"
                        value={bio.biographie}
                        onChange={handleChange}
                        rows="5"
                        placeholder="Racontez votre parcours..."
                    />
                </div>
                <div className="form-row">
                    <label>Photo de profil</label>
                    <input type="file" name="photo_profil" onChange={handleChange} accept="image/*" />
                </div>
                <div className="form-row">
                    <label>Site web</label>
                    <input name="lien_site" value={bio.lien_site} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Réseaux sociaux</label>
                    <input name="reseaux_sociaux" value={bio.reseaux_sociaux} onChange={handleChange} />
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Sauvegarde...' : 'Sauvegarder ma bio'}
                </button>
            </form>
        </div>
    );
}

export default BiographiePage;
