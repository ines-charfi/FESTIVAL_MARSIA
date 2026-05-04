import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api';

function NotificationsPage({ setPage, t }) {
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

    const isFR = t.nav_home === "Accueil";

    // 1. MAPPING DES TYPES DE NOTIFICATIONS
    const typeMap = {
        'FILM_VALIDE': isFR ? 'Film Validé' : 'Film Approved',
        'FILM_REJETE': isFR ? 'Film Rejeté' : 'Film Rejected',
        'VOTE_OUVERT': isFR ? 'Votes Ouverts' : 'Voting Open',
        'RESULTATS': isFR ? 'Résultats' : 'Results',
        'GENERAL': isFR ? 'Général' : 'General'
    };

    // 2. DICTIONNAIRE DE TRADUCTION DES CONTENUS (BDD -> FRONT)
    const translateContent = (text) => {
        if (!text) return "";
        if (isFR) return text;

        const translations = {
            "Votre film a été validé par le jury": "Your film has been approved by the jury",
            "Votre film a été rejeté": "Your film has been rejected",
            "Les votes sont désormais ouverts au public": "Voting is now open to the public",
            "Nouveau message du festival": "New message from the festival",
            "Félicitations pour votre prix": "Congratulations on your award"
        };
        return translations[text] || text;
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/notifications`);
            const data = await res.json();
            setNotifications(data);
        } catch {
            setError(isFR ? 'Impossible de charger les notifications' : 'Unable to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [isFR]);

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
        try {
            setLoading(true);
            const url = editingId ? `${API_URL}/notifications/${editingId}` : `${API_URL}/notifications`;
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    id_utilisateur: form.id_utilisateur ? Number(form.id_utilisateur) : null,
                }),
            });

            if (!res.ok) throw new Error();

            setForm({ id_utilisateur: '', type_notification: '', contenu: '', lu: false });
            setEditingId(null);
            setShowForm(false);
            fetchNotifications();
        } catch {
            setError(isFR ? 'Erreur enregistrement' : 'Save error');
        } finally {
            setLoading(false);
        }
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
        if (!window.confirm(isFR ? 'Supprimer cette notification ?' : 'Delete this notification?')) return;
        try {
            await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE' });
            fetchNotifications();
        } catch {
            setError(isFR ? 'Erreur suppression' : 'Delete error');
        }
    };

    return (
        <div className="admin-layout">
            <div className="admin-content">
                <div className="page-header">
                    <div>
                        <h1>🔔 {isFR ? "Gestion Notifications" : "Notifications Management"}</h1>
                        <p>{notifications.length} notifications</p>
                    </div>
                    <div className="page-actions">
                        <button className="btn-primary" onClick={() => { setEditingId(null); setShowForm(true); }}>
                            ➕ {isFR ? "Nouvelle notification" : "New notification"}
                        </button>
                        <button className="btn-home" onClick={() => setPage('home')}>
                            ← {t.nav_home}
                        </button>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-section">
                    <h3>{isFR ? "Liste des notifications" : "Notification List"} ({notifications.length})</h3>
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>{isFR ? "Utilisateur" : "User"}</th>
                                <th>{isFR ? "Type" : "Category"}</th>
                                <th>{isFR ? "Contenu" : "Content"}</th>
                                <th>{isFR ? "Statut" : "Status"}</th>
                                <th>{isFR ? "Date et Heure" : "Date and Time"}</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {notifications.map((n) => (
                                <tr key={n.id_notification}>
                                    <td>#{n.id_notification}</td>
                                    <td>{n.id_utilisateur || (isFR ? 'Tous' : 'All')}</td>
                                    <td>
                                            <span className={`type-badge type-${n.type_notification?.toLowerCase()}`}>
                                                {typeMap[n.type_notification] || n.type_notification}
                                            </span>
                                    </td>
                                    <td>{translateContent(n.contenu)}</td>
                                    <td>{n.lu ? '✅ ' + (isFR ? 'Lu' : 'Read') : '📩 ' + (isFR ? 'Non lu' : 'Unread')}</td>
                                    {/* AFFICHAGE DATE + HEURE + MIN + SEC */}
                                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        {n.date_envoi ? new Date(n.date_envoi).toLocaleString(isFR ? 'fr-FR' : 'en-US', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        }) : '-'}
                                    </td>
                                    <td>
                                        <button className="btn-edit" onClick={() => handleEdit(n)}>✏️</button>
                                        <button className="btn-delete" onClick={() => handleDelete(n.id_notification)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>{editingId ? (isFR ? '✏️ Modifier' : '✏️ Edit') : (isFR ? '➕ Nouvelle' : '➕ New')}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <label>{isFR ? "ID Utilisateur (optionnel)" : "User ID (optional)"}</label>
                                    <input name="id_utilisateur" type="number" value={form.id_utilisateur} onChange={handleChange} />
                                </div>
                                <div className="form-row">
                                    <label>{isFR ? "Type *" : "Category *"}</label>
                                    <select name="type_notification" value={form.type_notification} onChange={handleChange} required>
                                        <option value="">{isFR ? "Choisir..." : "Choose..."}</option>
                                        {Object.keys(typeMap).map(key => (
                                            <option key={key} value={key}>{typeMap[key]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <label>{isFR ? "Contenu *" : "Content *"}</label>
                                    <textarea name="contenu" value={form.contenu} onChange={handleChange} rows="4" required />
                                </div>
                                <div className="form-row checkbox-row">
                                    <label>
                                        <input type="checkbox" name="lu" checked={form.lu} onChange={handleChange} />
                                        {isFR ? "Marquée comme lue" : "Mark as read"}
                                    </label>
                                </div>
                                <div className="form-actions">
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? '...' : (isFR ? 'Enregistrer' : 'Save')}
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

export default NotificationsPage;