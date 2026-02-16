import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function BiographiePage({ setPage, user }) {
    const [bio, setBio] = useState({
        nom: '',
        prenom: '',
        biographie: '',
        photo_profil: null, // Fichier local (File)
        photo_url: '',      // URL venant de la base de données
        lien_site: '',
        reseaux_sociaux: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bioLoading, setBioLoading] = useState(true);

    // 🔄 Charge bio du user connecté
    useEffect(() => {
        if (!user?.id) { // Solution B : user.id
            setBioLoading(false);
            return;
        }

        setBioLoading(true);
        fetch(`${API_URL}/biographie/${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setBio({
                        nom: data.nom || '',
                        prenom: data.prenom || '',
                        biographie: data.biographie || '',
                        photo_profil: null,
                        photo_url: data.photo_profil || '', // On stocke l'URL de la DB
                        lien_site: data.lien_site || '',
                        reseaux_sociaux: data.reseaux_sociaux || ''
                    });
                }
                setBioLoading(false);
            })
            .catch(() => {
                setError('Erreur chargement bio');
                setBioLoading(false);
            });
    }, [user]);

    const handleChange = (e) => {
        const { name, type, value, files } = e.target;
        if (type === 'file') {
            setBio(b => ({ ...b, [name]: files[0] || null }));
        } else {
            setBio(b => ({ ...b, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!user?.id) {
            setError('Utilisateur non connecté');
            return;
        }

        const formData = new FormData();
        formData.append('id_utilisateur', user.id); // Solution B
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

            alert('✅ Biographie sauvegardée avec succès !');
        } catch (err) {
            setError(err.message || 'Erreur sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    // Déterminer quelle image afficher
    const getPhotoSrc = () => {
        if (bio.photo_profil) {
            return URL.createObjectURL(bio.photo_profil); // Aperçu du fichier choisi
        }
        if (bio.photo_url) {
            return `http://localhost:8081/${bio.photo_url}`; // Image stockée sur le serveur
        }
        return 'https://via.placeholder.com/150'; // Image par défaut
    };

    if (bioLoading) return <div className="page-container"><p>Chargement...</p></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>✍️ Ma Biographie</h1>
                <div className="page-actions">
                    <button className="btn-secondary" onClick={() => setPage('soumission-film')}>
                        🎬 Soumission Film
                    </button>
                    <button className="btn-home" onClick={() => setPage('home')}>
                        ← Accueil
                    </button>
                </div>
            </div>

            <div className="bio-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

                {/* 👤 PRÉVIEW BIO */}
                <div className="bio-preview card" style={{ textAlign: 'center' }}>
                    <img
                        src={getPhotoSrc()}
                        alt="Profil"
                        className="bio-photo"
                        style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px' }}
                    />
                    <h3>{bio.prenom} {bio.nom}</h3>
                    <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>{bio.biographie || 'Aucune biographie rédigée.'}</p>
                </div>

                {/* ✏️ FORMULAIRE */}
                <form onSubmit={handleSubmit} className="card">
                    <h3>Modifier mes informations</h3>
                    {error && <p className="error-banner">{error}</p>}

                    <div className="form-row">
                        <label>Nom</label>
                        <input name="nom" value={bio.nom} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Prénom</label>
                        <input name="prenom" value={bio.prenom} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Ma biographie</label>
                        <textarea
                            name="biographie"
                            value={bio.biographie}
                            onChange={handleChange}
                            rows="4"
                        />
                    </div>
                    <div className="form-row">
                        <label>Photo de profil</label>
                        <input type="file" name="photo_profil" onChange={handleChange} accept="image/*" />
                    </div>
                    <div className="form-row">
                        <label>Lien site web</label>
                        <input name="lien_site" value={bio.lien_site} onChange={handleChange} placeholder="https://..." />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Enregistrement...' : 'Sauvegarder ma biographie'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default BiographiePage;