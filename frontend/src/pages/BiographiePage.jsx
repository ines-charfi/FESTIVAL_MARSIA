import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function BiographiePage({ setPage, user }) {
    const [bio, setBio] = useState({
        nom: '',
        prenom: '',
        biographie: '',
        photo_profil: null, // File object
        lien_site: '',
        reseaux_sociaux: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bioLoading, setBioLoading] = useState(true); // pour le chargement initial

    // Charge bio du user connecté
    useEffect(() => {
        if (!user?.id_utilisateur) {
            setBioLoading(false);
            return;
        }

        setBioLoading(true);
        fetch(`${API_URL}/biographie/${user.id_utilisateur}`)
            .then(res => res.json())
            .then(data => {
                setBio({
                    nom: data.nom || '',
                    prenom: data.prenom || '',
                    biographie: data.biographie || '',
                    photo_profil: null, // On ne met pas le File ici
                    lien_site: data.lien_site || '',
                    reseaux_sociaux: data.reseaux_sociaux || ''
                });
                setBioLoading(false);
            })
            .catch(() => {
                setError('Erreur chargement bio');
                setBioLoading(false);
            });
    }, [user]);

    const handleChange = (e) => {
        const { name, type, value, files, checked } = e.target;
        if (type === 'file') {
            setBio(b => ({ ...b, [name]: files[0] || null }));
        } else if (type === 'checkbox') {
            setBio(b => ({ ...b, [name]: checked }));
        } else {
            setBio(b => ({ ...b, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!user?.id_utilisateur) {
            setError('Utilisateur non connecté');
            return;
        }

        const formData = new FormData();
        formData.append('id_utilisateur', user.id_utilisateur);
        formData.append('nom', bio.nom);
        formData.append('prenom', bio.prenom);
        formData.append('biographie', bio.biographie);
        formData.append('lien_site', bio.lien_site);
        formData.append('reseaux_sociaux', bio.reseaux_sociaux);
        if (bio.photo_profil) {
            formData.append('photo_profil', bio.photo_profil);
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/biographie`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erreur serveur');
            }

            setError('');
            alert('Biographie sauvegardée avec succès !');
        } catch (err) {
            setError(err.message || 'Erreur sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    if (bioLoading) {
        return <p>Chargement de votre biographie...</p>;
    }

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
                    src={bio.photo_profil ? URL.createObjectURL(bio.photo_profil) : '/default-avatar.png'}
                    alt="Photo"
                    className="bio-photo"
                />
                <h3>{bio.prenom} {bio.nom}</h3>
                <p>{bio.biographie || 'Aucune biographie'}</p>
                <div className="bio-links">
                    {bio.lien_site && <a href={bio.lien_site} target="_blank" rel="noopener noreferrer">🌐 Site</a>}
                    {bio.reseaux_sociaux && <a href={bio.reseaux_sociaux} target="_blank" rel="noopener noreferrer">📱 Réseaux</a>}
                </div>
            </div>

            {/* ✏️ FORMULAIRE */}
            <form onSubmit={handleSubmit} className="card">
                <h3>Modifier ma bio</h3>

                {error && <p className="error">{error}</p>}

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
