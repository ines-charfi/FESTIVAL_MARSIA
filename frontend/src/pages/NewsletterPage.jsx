import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api';

function NewsletterPage({ setPage, t }) { // 👈 Ajout de 't'
    const [newsletters, setNewsletters] = useState([]);
    const [form, setForm] = useState({
        email: '',
        langue: 'FR',
        confirme: false,
    });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isFR = t.nav_home === "Accueil";

    const fetchNewsletters = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/newsletter`);
            const data = await res.json();
            setNewsletters(data);
        } catch {
            setError(isFR ? 'Impossible de charger la newsletter' : 'Unable to load newsletter');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNewsletters();
    }, [isFR]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [e.target.name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);
            if (editingId) {
                await fetch(`${API_URL}/newsletter/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
            } else {
                await fetch(`${API_URL}/newsletter`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
            }

            setForm({ email: '', langue: 'FR', confirme: false });
            setEditingId(null);
            setShowForm(false);
            fetchNewsletters();
        } catch {
            setError(isFR ? "Erreur lors de l'enregistrement" : "Error while saving");
        } finally {
            setLoading(false);
        }
    };

    const openCreateForm = () => {
        setEditingId(null);
        setForm({ email: '', langue: 'FR', confirme: false });
        setShowForm(true);
    };

    const handleEdit = (item) => {
        setEditingId(item.id_news);
        setForm({
            email: item.email || '',
            langue: item.langue || 'FR',
            confirme: item.confirme || false,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const confirmMsg = isFR ? 'Supprimer cette inscription newsletter ?' : 'Delete this newsletter subscription?';
        if (!window.confirm(confirmMsg)) return;
        try {
            await fetch(`${API_URL}/newsletter/${id}`, { method: 'DELETE' });
            fetchNewsletters();
        } catch {
            setError(isFR ? 'Erreur suppression' : 'Error during deletion');
        }
    };

    return (
        <div className="admin-layout">
            <div className="admin-content">
                <div className="page-header">
                    <div>
                        <h1>📧 {isFR ? "Gestion Newsletter" : "Newsletter Management"}</h1>
                        <p>{newsletters.length} {isFR ? "inscriptions" : "subscriptions"}</p>
                    </div>
                    <div className="page-actions">
                        <button className="btn-primary" onClick={openCreateForm}>
                            ➕ {isFR ? "Nouvelle inscription" : "New subscription"}
                        </button>
                        <button className="btn-home" onClick={() => setPage('home')}>
                            ← {t.nav_home}
                        </button>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-section">
                    <h3>{isFR ? "Inscriptions" : "Subscriptions"} ({newsletters.length})</h3>
                    {loading ? (
                        <div className="loading">{t.loading || "Chargement..."}</div>
                    ) : newsletters.length === 0 ? (
                        <div className="empty-state">
                            <p>{isFR ? "Aucune inscription" : "No subscriptions"}</p>
                            <button className="btn-primary" onClick={openCreateForm}>
                                ➕ {isFR ? "Ajouter la première" : "Add the first one"}
                            </button>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>{isFR ? "Langue" : "Language"}</th>
                                    <th>{isFR ? "Confirmé" : "Confirmed"}</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {newsletters.map((n) => (
                                    <tr key={n.id_news}>
                                        <td>#{n.id_news}</td>
                                        <td>{n.email}</td>
                                        <td>{n.langue}</td>
                                        <td>{n.confirme ? (isFR ? '✅ Oui' : '✅ Yes') : (isFR ? '⏳ Non' : '⏳ No')}</td>
                                        <td>{new Date(n.date_inscription).toLocaleDateString(isFR ? 'fr-FR' : 'en-US')}</td>
                                        <td>
                                            <button className="btn-edit" onClick={() => handleEdit(n)} title={isFR ? "Modifier" : "Edit"}>✏️</button>
                                            <button className="btn-delete" onClick={() => handleDelete(n.id_news)} title={isFR ? "Supprimer" : "Delete"}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODAL FORMULAIRE */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingId ? (isFR ? '✏️ Modifier' : '✏️ Edit') : (isFR ? '➕ Nouvelle inscription' : '➕ New subscription')}</h3>
                                <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <label>Email *</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <label>{isFR ? "Langue *" : "Language *"}</label>
                                    <select name="langue" value={form.langue} onChange={handleChange}>
                                        <option value="FR">🇫🇷 Français</option>
                                        <option value="EN">🇺🇸 English</option>
                                    </select>
                                </div>
                                <div className="form-row checkbox-row">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="confirme"
                                            checked={form.confirme}
                                            onChange={handleChange}
                                        />
                                        {isFR ? "Confirmé" : "Confirmed"}
                                    </label>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? '...' : (editingId ? (isFR ? 'Mettre à jour' : 'Update') : (isFR ? 'Créer' : 'Create'))}
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                        {isFR ? "Annuler" : "Cancel"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NewsletterPage;