import React, { useState } from 'react';

function RegisterPage({ setUser, setPage }) {
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        mot_de_passe: '',
        nom_role: 'REALISATEUR'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8081/api/v1/utilisateurs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
                setPage('home');
            } else {
                setError('Erreur lors de l\'inscription');
            }
        } catch (err) {
            setError('Erreur serveur');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        /* auth-wrapper s'occupe de centrer horizontalement et verticalement */
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>S'inscrire</h2>
                    <p>Rejoignez MARSIA 2026</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 mb-4 bg-red-500/10 p-2 rounded">{error}</div>}

                    <div className="auth-input-group">
                        <input
                            name="nom"
                            placeholder="Nom *"
                            value={form.nom}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <input
                            name="prenom"
                            placeholder="Prénom *"
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
                            placeholder="Mot de passe *"
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
                            <option value="REALISATEUR">Réalisateur</option>
                            <option value="PUBLIC">Public</option>

                        </select>
                    </div>

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? 'Inscription...' : "S'inscrire gratuitement"}
                    </button>
                </form>

                <div className="mt-6 text-sm text-gray-400">
                    Déjà inscrit ?{' '}
                    <button onClick={() => setPage('login')} className="link-btn">
                        Se connecter
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;