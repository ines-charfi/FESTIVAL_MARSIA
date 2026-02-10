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
            const res = await fetch('http://localhost:8081/api/v1/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    mot_de_passe: form.mot_de_passe
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Email ou mot de passe incorrect');
                setLoading(false);
                return;
            }

            const user = data.user;
            setUser(user);

            // 🔑 REDIRECTION SELON RÔLE

            switch (user.nom_role) {
                case 'ADMIN':
                    setPage('admin-users');
                    break;
                case 'REALISATEUR':
                    setPage('soumission-film');
                    break;
                case 'JURY':
                    setPage('jury-dashboard');
                    break;
                default:
                    setPage('home');
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
        <div className="auth-wrapper">
            <div className="auth-card">
                <h2>Connexion</h2>
                <p>Accédez à l'univers MARSIA</p>

                <form onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 mb-4 bg-red-500/10 p-2 rounded">{error}</div>}

                    <div className="auth-input-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <input
                            type="password"
                            name="mot_de_passe"
                            placeholder="Mot de passe"
                            value={form.mot_de_passe}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>

                <div className="mt-6 text-sm text-gray-400">
                    Pas encore de compte ?{' '}
                    <button onClick={() => setPage('register')} className="link-btn">
                        S'inscrire
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
