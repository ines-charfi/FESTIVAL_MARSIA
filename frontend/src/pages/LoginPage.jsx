import React, { useState } from 'react';

function LoginPage({ setUser, setPage }) {
    const [form, setForm] = useState({
        email: '',
        mot_de_passe: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8081/api/v1/utilisateurs?email=' + form.email);
            const users = await res.json();

            const user = users.find(u => u.email === form.email);
            if (user && form.mot_de_passe === user.mot_de_passe) {
                setUser(user);

                // 🔑 REDIRECTION SELON RÔLE
                switch (user.nom_role) {
                    case 'ADMIN':
                        setPage('admin-users'); // Dashboard Admin
                        break;
                    case 'REALISATEUR':
                        setPage('soumission-film'); // Soumission film
                        break;
                    case 'JURY':
                        setPage('jury-dashboard'); // Tableau de bord Jury
                        break;
                    default: // PUBLIC
                        setPage('home');
                }
            } else {
                setError('Email ou mot de passe incorrect');
            }
        } catch (err) {
            setError('Erreur connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🔐 Connexion</h1>
                    <p>Accédez à votre espace MARSIA</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}

                    <div className="form-row">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email *"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <input
                            type="password"
                            name="mot_de_passe"
                            placeholder="Mot de passe *"
                            value={form.mot_de_passe}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary btn-large" disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Pas de compte ? <button onClick={() => setPage('register')} className="link-btn">S'inscrire</button></p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
