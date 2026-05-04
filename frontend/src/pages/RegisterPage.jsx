import React, { useState } from 'react';

function RegisterPage({ setPage, t }) { // 👈 Ajout de 't' pour les traductions
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        mot_de_passe: '',
        nom_role: 'REALISATEUR'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Détection de la langue via un mot-clé de l'objet de traduction
    const isFR = t.nav_home === "Accueil";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8081/api/utilisateurs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                const successMsg = isFR
                    ? "Inscription réussie ! Veuillez vous connecter."
                    : "Registration successful! Please log in.";
                alert(successMsg);
                setPage('login');
            } else {
                const data = await res.json();
                setError(data.error || (isFR ? 'Erreur lors de l\'inscription' : 'Registration error'));
            }
        } catch (err) {
            setError(isFR ? 'Erreur serveur' : 'Server error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>{isFR ? "S'inscrire" : "Sign Up"}</h2>
                    <p>{isFR ? "Rejoignez MARSIA 2026" : "Join MARSIA 2026"}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 mb-4 bg-red-500/10 p-2 rounded">{error}</div>}

                    <div className="auth-input-group">
                        <input
                            name="nom"
                            placeholder={isFR ? "Nom *" : "Last Name *"}
                            value={form.nom}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <input
                            name="prenom"
                            placeholder={isFR ? "Prénom *" : "First Name *"}
                            value={form.prenom}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email *"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <input
                            type="password"
                            name="mot_de_passe"
                            placeholder={isFR ? "Mot de passe *" : "Password *"}
                            value={form.mot_de_passe}
                            onChange={handleChange}
                            minLength="6"
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <select
                            name="nom_role"
                            value={form.nom_role}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-violet-500/30 rounded-xl p-3 text-white focus:border-pink-500 outline-none transition-all"
                        >
                            <option value="REALISATEUR">{isFR ? "Réalisateur" : "Director"}</option>
                            <option value="PUBLIC">{isFR ? "Public" : "Public"}</option>
                            <option value="JURY">{isFR ? "Jury" : "Jury"}</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading
                            ? (isFR ? 'Inscription...' : 'Registering...')
                            : (isFR ? "S'inscrire gratuitement" : "Register for free")
                        }
                    </button>
                </form>

                <div className="mt-6 text-sm text-gray-400">
                    {isFR ? "Déjà inscrit ?" : "Already registered?"}{' '}
                    <button onClick={() => setPage('login')} className="link-btn">
                        {isFR ? "Se connecter" : "Login"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;