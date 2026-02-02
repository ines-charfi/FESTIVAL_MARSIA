import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function OutilsIAPage() {
    const [outils, setOutils] = useState([]);
    const [form, setForm] = useState({
        nom_outil: '',
        type_outil: '',
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    const fetchOutils = async () => {
        try {
            const res = await fetch(`${API_URL}/outils-ia`);
            const data = await res.json();
            setOutils(data);
        } catch {
            setError('Impossible de charger les outils');
        }
    };

    useEffect(() => {
        fetchOutils();
    }, []);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await fetch(`${API_URL}/outils-ia/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
            } else {
                await fetch(`${API_URL}/outils-ia`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
            }

            setForm({ nom_outil: '', type_outil: '' });
            setEditingId(null);
            fetchOutils();
        } catch {
            setError('Erreur enregistrement');
        }
    };

    const handleEdit = (outil) => {
        setEditingId(outil.id_outil);
        setForm({
            nom_outil: outil.nom_outil || '',
            type_outil: outil.type_outil || '',
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ?')) return;
        try {
            await fetch(`${API_URL}/outils-ia/${id}`, { method: 'DELETE' });
            fetchOutils();
        } catch {
            setError('Erreur suppression');
        }
    };

    return (
        <div>
            <h2>Outils IA</h2>
            {error && <p className="error">{error}</p>}

            <form className="card" onSubmit={handleSubmit}>
                <h3>{editingId ? 'Modifier outil' : 'Nouvel outil'}</h3>
                <div className="form-row">
                    <label>Nom</label>
                    <input name="nom_outil" value={form.nom_outil} onChange={handleChange} required />
                </div>
                <div className="form-row">
                    <label>Type</label>
                    <select name="type_outil" value={form.type_outil} onChange={handleChange} required>
                        <option value="">Sélectionner...</option>
                        <option value="Image">Image</option>
                        <option value="Texte">Texte</option>
                        <option value="Video">Vidéo</option>
                        <option value="Audio">Audio</option>
                    </select>
                </div>
                <button type="submit">{editingId ? 'Modifier' : 'Créer'}</button>
            </form>

            <h3>Liste outils IA</h3>
            <table className="table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {outils.map((o) => (
                    <tr key={o.id_outil}>
                        <td>{o.id_outil}</td>
                        <td>{o.nom_outil}</td>
                        <td>{o.type_outil}</td>
                        <td>
                            <button onClick={() => handleEdit(o)}>✏️</button>
                            <button onClick={() => handleDelete(o.id_outil)}>🗑️</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default OutilsIAPage;
