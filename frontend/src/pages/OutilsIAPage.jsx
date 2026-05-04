import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api';

function OutilsIAPage({ t }) { // 👈 Ajout de 't'
    const [outils, setOutils] = useState([]);
    const [form, setForm] = useState({
        nom_outil: '',
        type_outil: '',
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isFR = t.nav_home === "Accueil";

    // 1. Mapping pour traduire les types d'outils venant de la BDD
    const typeMap = {
        'Image': isFR ? 'Image' : 'Image',
        'Texte': isFR ? 'Texte' : 'Text',
        'Video': isFR ? 'Vidéo' : 'Video',
        'Audio': isFR ? 'Audio' : 'Audio'
    };

    const fetchOutils = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/outils-ia`);
            const data = await res.json();
            setOutils(data);
        } catch {
            setError(isFR ? 'Impossible de charger les outils' : 'Unable to load tools');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOutils();
    }, [isFR]);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
            setError(isFR ? 'Erreur enregistrement' : 'Save error');
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
        const confirmMsg = isFR ? 'Voulez-vous vraiment supprimer cet outil ?' : 'Do you really want to delete this tool?';
        if (!window.confirm(confirmMsg)) return;
        try {
            await fetch(`${API_URL}/outils-ia/${id}`, { method: 'DELETE' });
            fetchOutils();
        } catch {
            setError(isFR ? 'Erreur suppression' : 'Delete error');
        }
    };

    return (
        <div className="admin-container">
            <h2>{isFR ? '🛠️ Gestion des Outils IA' : '🛠️ AI Tools Management'}</h2>

            {error && <p className="error-banner">{error}</p>}

            <form className="card" onSubmit={handleSubmit}>
                <h3>{editingId ? (isFR ? 'Modifier outil' : 'Edit Tool') : (isFR ? 'Nouvel outil' : 'New Tool')}</h3>

                <div className="form-row">
                    <label>{isFR ? 'Nom de l\'outil' : 'Tool Name'}</label>
                    <input
                        name="nom_outil"
                        value={form.nom_outil}
                        onChange={handleChange}
                        placeholder={isFR ? "Ex: ChatGPT, Midjourney..." : "e.g. ChatGPT, Midjourney..."}
                        required
                    />
                </div>

                <div className="form-row">
                    <label>Type</label>
                    <select name="type_outil" value={form.type_outil} onChange={handleChange} required>
                        <option value="">{isFR ? 'Sélectionner...' : 'Select...'}</option>
                        {/* On utilise les clés du typeMap pour rester cohérent avec la BDD */}
                        <option value="Image">{typeMap['Image']}</option>
                        <option value="Texte">{typeMap['Texte']}</option>
                        <option value="Video">{typeMap['Video']}</option>
                        <option value="Audio">{typeMap['Audio']}</option>
                    </select>
                </div>

                <button type="submit" className="btn-primary">
                    {editingId ? (isFR ? 'Mettre à jour' : 'Update') : (isFR ? 'Créer' : 'Create')}
                </button>

                {editingId && (
                    <button type="button" className="btn-secondary" onClick={() => {setEditingId(null); setForm({nom_outil:'', type_outil:''})}}>
                        {isFR ? 'Annuler' : 'Cancel'}
                    </button>
                )}
            </form>

            <div className="table-section">
                <h3>{isFR ? 'Liste des outils IA' : 'AI Tools List'} ({outils.length})</h3>
                <table className="admin-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>{isFR ? 'Nom' : 'Name'}</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan="4">{isFR ? 'Chargement...' : 'Loading...'}</td></tr>
                    ) : outils.length === 0 ? (
                        <tr><td colSpan="4">{isFR ? 'Aucun outil trouvé' : 'No tools found'}</td></tr>
                    ) : (
                        outils.map((o) => (
                            <tr key={o.id_outil}>
                                <td>#{o.id_outil}</td>
                                <td><strong>{o.nom_outil}</strong></td>
                                <td>
                                        <span className={`badge-${o.type_outil?.toLowerCase()}`}>
                                            {typeMap[o.type_outil] || o.type_outil}
                                        </span>
                                </td>
                                <td>
                                    <button className="btn-edit" onClick={() => handleEdit(o)} title={isFR ? "Modifier" : "Edit"}>✏️</button>
                                    <button className="btn-delete" onClick={() => handleDelete(o.id_outil)} title={isFR ? "Supprimer" : "Delete"}>🗑️</button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default OutilsIAPage;