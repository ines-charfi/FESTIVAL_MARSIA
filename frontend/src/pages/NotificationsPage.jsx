import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function NotificationsPage({ setPage }) {
    const [notifications, setNotifications] = useState([]);
    const [form, setForm] = useState({
        id_utilisateur: '',
        type_notification: '',
        contenu: '',
        lu: false,
    });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/notifications`);
            const data = await res.json();
            setNotifications(data);
        } catch {
            setError('Impossible de charger les notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setForm((f) => ({
            ...f,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            ...form,
            id_utilisateur: form.id_utilisateur ? Number(form.id_utilisateur) : null,
        };

        try {
            setLoading(true);
            const url = editingId
                ? `${API_URL}/notifications/${editingId}`
                : `${API_URL}/notifications`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erreur serveur');
            }

            setForm({
                id_utilisateur: '',
                type_notification: '',
                contenu: '',
                lu: false,
            });
            setEditingId(null);
            setShowForm(false);
            fetchNotifications();
        } catch (err) {
            setError(err.message || 'Erreur enregistrement');
        } finally {
            setLoading(false);
        }
    };

    const openCreateForm = () => {
        setEditingId(null);
        setForm({
            id_utilisateur: '',
            type_notification: '',
            contenu: '',
            lu: false,
        });
        setShowForm(true);
    };

    const handleEdit = (notif) => {
        setEditingId(notif.id_notification);
        setForm({
            id_utilisateur: notif.id_utilisateur ?? '',
            type_notification: notif.type_notification ?? '',
            contenu: notif.contenu ?? '',
            lu: !!notif.lu,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette notification ?')) return;
        try {
            await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE' });
            fetchNotifications();
        } catch {
            setError('Erreur suppression');
        }
    };

    return (
        <div className="admin-layout">

            {/* 📊 CONTENU */}
            <div className="admin-content">
                <div className="page-header">
                    <div>
                        <h1>🔔 Gestion Notifications</h1>
                        <p>{notifications.length} notifications</p>
                    </div>
                    <div className="page-actions">
                        <button className="btn-primary" onClick={openCreateForm}>
                            ➕ Nouvelle notification
                        </button>
                        <button className="btn-home" onClick={() => setPage('home')}>
                            ← Accueil
                        </button>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-section">
                    <h3>Liste des notifications ({notifications.length})</h3>
                    {loading ? (
                        <div className="loading">Chargement...</div>
                    ) : notifications.length === 0 ? (
                        <div className="empty-state">
                            <p>Aucune notification</p>
                            <button className="btn-primary" onClick={openCreateForm}>
                                ➕ Créer la première
                            </button>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Utilisateur</th>
                                    <th>Type</th>
                                    <th>Contenu</th>
                                    <th>Lu</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {notifications.map((n) => (
                                    <tr key={n.id_notification}>
                                        <td>#{n.id_notification}</td>
                                        <td>{n.id_utilisateur || 'Tous'}</td>
                                        <td>
                                                <span className={`type-badge type-${n.type_notification?.toLowerCase()}`}>
                                                    {n.type_notification || 'Général'}
                                                </span>
                                        </td>
                                        <td>{n.contenu?.substring(0, 50)}${n.contenu?.length > 50 ? '...' : ''}</td>
                                        <td>{n.lu ? '✅ Oui' : '📩 Non'}</td>
                                        <td>{n.date_envoi ? new Date(n.date_envoi).toLocaleString('fr-FR') : '-'}</td>
                                        <td>
                                            <button className="btn-edit" onClick={() => handleEdit(n)} title="Modifier">
                                                ✏️
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDelete(n.id_notification)} title="Supprimer">
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 🆕 MODAL FORMULAIRE */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingId ? '✏️ Modifier notification' : '➕ Nouvelle notification'}</h3>
                                <button className="modal-close" onClick={() => setShowForm(false)}>
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                {error && <div className="error">{error}</div>}

                                <div className="form-row">
                                    <label>ID Utilisateur (optionnel)</label>
                                    <input
                                        name="id_utilisateur"
                                        type="number"
                                        value={form.id_utilisateur}
                                        onChange={handleChange}
                                        placeholder="Laisser vide pour tous les utilisateurs"
                                    />
                                </div>

                                <div className="form-row">
                                    <label>Type *</label>
                                    <select name="type_notification" value={form.type_notification} onChange={handleChange} required>
                                        <option value="">Choisir un type</option>
                                        <option value="FILM_VALIDE">Film Validé</option>
                                        <option value="FILM_REJETE">Film Rejeté</option>
                                        <option value="VOTE_OUVERT">Votes Ouverts</option>
                                        <option value="RESULTATS">Résultats</option>
                                        <option value="GENERAL">Général</option>
                                    </select>
                                </div>

                                <div className="form-row">
                                    <label>Contenu *</label>
                                    <textarea
                                        name="contenu"
                                        value={form.contenu}
                                        onChange={handleChange}
                                        rows="4"
                                        placeholder="Votre message..."
                                        required
                                    />
                                </div>

                                <div className="form-row checkbox-row">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="lu"
                                            checked={form.lu}
                                            onChange={handleChange}
                                        />
                                        Marquée comme lue
                                    </label>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? '...' : (editingId ? 'Mettre à jour' : 'Créer notification')}
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
    );
}

export default NotificationsPage;
