import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8081/api';
const SERVER_URL = 'http://localhost:8081'; // Pour les images

function BiographiePage({ setPage, user, t }) {
    const [bio, setBio] = useState({
        nom: '',
        prenom: '',
        biographie: '', // Sera mappé vers texte_biographie
        photo_profil: null, // Le fichier pour l'upload
        photo_url: '',      // L'URL venant du serveur
        site_officiel: '',  // Nom exact BDD
        instagram: '',
        youtube: '',
        twitter: '',
        pays_origine: ''    // Nom exact BDD
    });

    const [loading, setLoading] = useState(false);
    const [bioLoading, setBioLoading] = useState(true);

    const isFR = t.nav_home === "Accueil";

    useEffect(() => {
        if (!user?.id) { setBioLoading(false); return; }
        setBioLoading(true);

        // On récupère les données
        fetch(`${API_URL}/biographie/${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setBio({
                        nom: data.nom || '',
                        prenom: data.prenom || '',
                        biographie: data.texte_biographie || '', // Mappage
                        site_officiel: data.site_officiel || '',
                        pays_origine: data.pays_origine || '',
                        instagram: data.instagram || '',
                        youtube: data.youtube || '',
                        twitter: data.twitter || '',
                        photo_url: data.photo_profil || '', // Chemin relatif de l'image
                        photo_profil: null
                    });
                }
                setBioLoading(false);
            })
            .catch(() => setBioLoading(false));
    }, [user]);

    const handleChange = (e) => {
        const { name, type, value, files } = e.target;
        setBio(b => ({ ...b, [name]: type === 'file' ? files[0] : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('id_utilisateur', user.id);
        formData.append('nom', bio.nom);
        formData.append('prenom', bio.prenom);
        formData.append('biographie', bio.biographie); // Envoyé comme 'biographie' pour le backend
        formData.append('site_officiel', bio.site_officiel);
        formData.append('pays_origine', bio.pays_origine);
        formData.append('instagram', bio.instagram);
        formData.append('youtube', bio.youtube);
        formData.append('twitter', bio.twitter);
        formData.append('photo_url', bio.photo_url); // On renvoie l'ancienne URL si pas de nouveau fichier

        if (bio.photo_profil) {
            formData.append('photo_profil', bio.photo_profil);
        }

        try {
            const res = await fetch(`${API_URL}/biographie`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();
            if(result.success) {
                alert(isFR ? '✅ Profil synchronisé !' : '✅ Profile synced!');
            }
        } catch (err) {
            console.error(err);
            alert("Error syncing data");
        }
        setLoading(false);
    };

    // Gestion de l'affichage de l'image (Locale si choisie, sinon Serveur, sinon Placeholder)
    const getAvatarSource = () => {
        if (bio.photo_profil) return URL.createObjectURL(bio.photo_profil);
        if (bio.photo_url) return `${SERVER_URL}/${bio.photo_url}`;
        return 'https://via.placeholder.com/150';
    };

    if (bioLoading) return <div className="loading-cyber">SCANNING_PROFILE...</div>;

    return (
        <div className="bio-page-cyber">
            <header className="page-header-cyber">
                <div className="header-titles">
                    <h1>{isFR ? "PROFIL CRÉATEUR" : "CREATOR PROFILE"}</h1>
                    <span className="user-id">ID: {user?.id} // ACCESS: ARTIST</span>
                </div>
                <div className="header-actions">
                    <button className="btn-cyber-outline" onClick={() => setPage('soumission-film')}>🎬 SUBMISSION</button>
                    <button className="btn-cyber-exit" onClick={() => setPage('home')}>EXIT ↩</button>
                </div>
            </header>

            <div className="bio-main-grid">
                <aside className="bio-preview-sidebar">
                    <div className="photo-container-neon">
                        <img src={getAvatarSource()} alt="Profil" className="bio-photo-img" />
                        <div className="photo-overlay-scan"></div>
                    </div>
                    <h2 className="text-gradient">{bio.prenom || '---'} {bio.nom || '---'}</h2>

                    <div className="social-preview-icons">
                        {bio.instagram && <span title="Instagram">📸</span>}
                        {bio.youtube && <span title="YouTube">📺</span>}
                        {bio.twitter && <span title="Twitter">🐦</span>}
                    </div>

                    <div className="bio-scroll-area">
                        <p className="bio-text">{bio.biographie || (isFR ? "Aucune biographie rédigée..." : "No biography written...")}</p>
                    </div>
                </aside>

                <main className="bio-form-container">
                    <form onSubmit={handleSubmit} className="form-cyber-card">
                        <h3 className="form-title">CORE_DATA_STORAGE</h3>

                        <div className="form-grid">
                            <div className="input-group"><label>NOM / LASTNAME</label>
                                <input name="nom" value={bio.nom} onChange={handleChange} required />
                            </div>
                            <div className="input-group"><label>PRÉNOM / FIRSTNAME</label>
                                <input name="prenom" value={bio.prenom} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="input-group"><label>PAYS / COUNTRY</label>
                                <input name="pays_origine" value={bio.pays_origine} onChange={handleChange} />
                            </div>
                            <div className="input-group"><label>SITE_OFFICIEL / URL</label>
                                <input name="site_officiel" value={bio.site_officiel} onChange={handleChange} placeholder="https://..." />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>BIO_DATA (NEURAL_LOG)</label>
                            <textarea name="biographie" value={bio.biographie} onChange={handleChange} rows="4" />
                        </div>

                        <div className="social-inputs-grid">
                            <div className="input-group">
                                <label>📸 INSTAGRAM</label>
                                <input name="instagram" value={bio.instagram} onChange={handleChange} placeholder="@username" />
                            </div>
                            <div className="input-group">
                                <label>📺 YOUTUBE</label>
                                <input name="youtube" value={bio.youtube} onChange={handleChange} placeholder="Channel link" />
                            </div>
                            <div className="input-group">
                                <label>🐦 TWITTER / X</label>
                                <input name="twitter" value={bio.twitter} onChange={handleChange} placeholder="@handle" />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>AVATAR_UPLOAD (JPG/PNG)</label>
                            <input type="file" name="photo_profil" onChange={handleChange} accept="image/*" className="file-input-cyber" />
                        </div>

                        <button type="submit" disabled={loading} className="btn-submit-neon">
                            {loading ? 'SYNCING_WITH_DB...' : 'CONFIRM_CHANGES'}
                        </button>
                    </form>
                </main>
            </div>
        </div>
    );
}

export default BiographiePage;