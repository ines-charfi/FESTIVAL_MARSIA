import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function BiographiePage() {
    const [form, setForm] = useState({
        id_utilisateur: '',
        texte_biographie: '',
        site_officiel: '',
        pays_origine: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/utilisateurs/${form.id_utilisateur}/biographie`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error();

            setForm({ id_utilisateur: '', texte_biographie: '', site_officiel: '', pays_origine: '' });
            alert('Biographie créée !');
        } catch {
            setError('Erreur création biographie');
        }
    };

    return (
        <div>
            <h2>Biographie</h2>
            {error && <p className="error">{error}</p>}

            <form className="card" onSubmit={handleSubmit}>
                <h3>Créer/Modifier biographie</h3>
                <div className="form-row">
                    <label>ID Utilisateur</label>
                    <input name="id_utilisateur" value={form.id_utilisateur} onChange={handleChange} required />
                </div>
                <div className="form-row">
                    <label>Texte biographie</label>
                    <textarea name="texte_biographie" value={form.texte_biographie} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Site officiel</label>
                    <input name="site_officiel" value={form.site_officiel} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Pays origine</label>
                    <input name="pays_origine" value={form.pays_origine} onChange={handleChange} />
                </div>
                <button type="submit">Créer biographie</button>
            </form>
        </div>
    );
}

export default BiographiePage;
