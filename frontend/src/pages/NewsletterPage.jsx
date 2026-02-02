import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function NewsletterPage({ setPage }) {
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

    const fetchNewsletters = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/newsletter`);
            const data = await res.json();
            setNewsletters(data);
        } catch {
            setError('Impossible de charger la newsletter');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNewsletters();
    }, []);

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
            setError('Erreur lors de l\'enregistrement');
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
        if (!window.confirm('Supprimer cette inscription newsletter ?')) return;
        try {
            await fetch(`${API_URL}/newsletter/${id}`, { method: 'DELETE' });
            fetchNewsletters();
        } catch {
            setError('Erreur suppression');
        }
    };

    return (
        <div className="admin-layout">

            {/* CONTENU */}
            <div className="admin-content">
                {/* ✅ PAGE HEADER CORRIGÉ */}
                <div className="page-header">
                    <div>
                        <h1>📧 Gestion Newsletter</h1>
                        <p>{newsletters.length} inscriptions</p>
                    </div>
                    <div className="page-actions">
                        <button className="btn-primary" onClick={openCreateForm}>
                            ➕ Nouvelle inscription
                        </button>
                        <button className="btn-home" onClick={() => setPage('home')}>
                            ← Accueil
                        </button>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-section">
                    <h3>Inscriptions Newsletter ({newsletters.length})</h3>
                    {loading ? (
                        <div className="loading">Chargement...</div>
                    ) : newsletters.length === 0 ? (
                        <div className="empty-state">
                            <p>Aucune inscription</p>
                            <button className="btn-primary" onClick={openCreateForm}>
                                ➕ Ajouter la première
                            </button>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Langue</th>
                                    <th>Confirmé</th>
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
                                        <td>{n.confirme ? '✅ Oui' : '⏳ Non'}</td>
                                        <td>{new Date(n.date_inscription).toLocaleDateString('fr-FR')}</td>
                                        <td>
                                            <button className="btn-edit" onClick={() => handleEdit(n)} title="Modifier">✏️</button>
                                            <button className="btn-delete" onClick={() => handleDelete(n.id_news)} title="Supprimer">🗑️</button>
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
                                <h3>{editingId ? '✏️ Modifier' : '➕ Nouvelle inscription'}</h3>
                                <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                {error && <div className="error">{error}</div>}

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
                                    <label>Langue *</label>
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
                                        Confirmé
                                    </label>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? '...' : (editingId ? 'Mettre à jour' : 'Créer')}
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    ); // ✅ CLÔTURE CORRIGÉE
}

export default NewsletterPage;
