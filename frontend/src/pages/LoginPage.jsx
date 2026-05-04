import React, { useState } from 'react';

function LoginPage({ setUser, setPage, t }) { // 👈 Ajout de 't'
    const [form, setForm] = useState({
        email: '',
        mot_de_passe: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isFR = t.nav_home === "Accueil"; // Helper pour les messages système

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8081/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    mot_de_passe: form.mot_de_passe
                })
            });

            const data = await res.json();

            if (!res.ok) {
                // Traduction du message d'erreur
                setError(data.message || (isFR ? 'Email ou mot de passe incorrect' : 'Invalid email or password'));
                setLoading(false);
                return;
            }

            const user = data.user;
            setUser({
                id: user.id_utilisateur,
                nom: user.nom,
                prenom: user.prenom,
                nom_role: user.nom_role
            });

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
            setError(isFR ? 'Erreur connexion' : 'Connection error');
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
                {/* Titre et Sous-titre traduits */}
                <h2>{t.nav_login}</h2>
                <p>{isFR ? "Accédez à l'univers MARSIA" : "Access the MARSIA universe"}</p>

                <form onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 mb-4 bg-red-500/10 p-2 rounded">{error}</div>}

                    <div className="auth-input-group">
                        <input
                            type="email"
                            name="email"
                            placeholder={t.label_email || "Email"}
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <input
                            type="password"
                            name="mot_de_passe"
                            placeholder={isFR ? "Mot de passe" : "Password"}
                            value={form.mot_de_passe}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading
                            ? (isFR ? 'Connexion en cours...' : 'Logging in...')
                            : t.nav_login}
                    </button>
                </form>

                <div className="mt-6 text-sm text-gray-400">
                    {isFR ? 'Pas encore de compte ?' : 'No account yet?'}
                    {' '}
                    <button onClick={() => setPage('register')} className="link-btn">
                        {t.nav_register}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;