import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api';

function AdminUsersPage({ setPage, t }) { // 👈 Ajout de 't'
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        mot_de_passe: '',
        nom_role: 'PUBLIC',
        actif: true
    });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isFR = t.nav_home === "Accueil";

    // Mapping des rôles pour l'affichage
    const roleLabels = {
        'PUBLIC': isFR ? 'PUBLIC' : 'PUBLIC',
        'JURY': isFR ? 'JURY' : 'JURY',
        'REALISATEUR': isFR ? 'RÉALISATEUR' : 'DIRECTOR',
        'ADMIN': isFR ? 'ADMIN' : 'ADMIN'
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/utilisateurs`);
            const data = await res.json();
            setUsers(data);
        } catch (e) {
            setError(isFR ? "Impossible de charger les utilisateurs" : "Unable to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [isFR]);

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleToggleActif = (e) => {
        setForm(f => ({ ...f, actif: e.target.checked }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const payload = {
            nom: form.nom,
            prenom: form.prenom,
            email: form.email,
            nom_role: form.nom_role,
            actif: form.actif ? 1 : 0,
            mot_de_passe: form.mot_de_passe || undefined,
        };

        try {
            const url = editingId ? `${API_URL}/utilisateurs/${editingId}` : `${API_URL}/utilisateurs`;
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || (isFR ? "Erreur enregistrement" : "Save error"));
            }

            setShowForm(false);
            setEditingId(null);
            setForm({ nom: '', prenom: '', email: '', mot_de_passe: '', nom_role: 'PUBLIC', actif: true });
            fetchUsers();
            alert(editingId
                ? (isFR ? "Utilisateur mis à jour !" : "User updated!")
                : (isFR ? "Utilisateur créé !" : "User created!")
            );
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingId(user.id_utilisateur);
        setForm({
            nom: user.nom || '',
            prenom: user.prenom || '',
            email: user.email || '',
            mot_de_passe: '',
            nom_role: user.nom_role || 'PUBLIC',
            actif: Number(user.actif) === 1
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isFR ? 'Voulez-vous supprimer cet utilisateur ?' : 'Do you want to delete this user?')) return;

        try {
            const res = await fetch(`${API_URL}/admin/utilisateurs/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (res.ok) {
                alert(isFR ? "Utilisateur supprimé" : "User deleted");
                fetchUsers();
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError(isFR ? "Erreur serveur" : "Server error");
        }
    };

    return (
        <div className="admin-content">
            <div className="page-header">
                <div>
                    <h1>👥 {isFR ? "Gestion Utilisateurs" : "User Management"}</h1>
                    <p>{users.length} {isFR ? "comptes enregistrés" : "registered accounts"}</p>
                </div>
                <div className="page-actions">
                    <button className="btn-primary" onClick={() => { setEditingId(null); setShowForm(true); }}>
                        ➕ {isFR ? "Ajouter utilisateur" : "Add User"}
                    </button>
                    <button className="btn-home" onClick={() => setPage('home')}>
                        ← {isFR ? "Accueil" : "Home"}
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-section">
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>{isFR ? "Nom complet" : "Full Name"}</th>
                            <th>Email</th>
                            <th>{isFR ? "Rôle" : "Role"}</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((u) => (
                            <tr key={u.id_utilisateur}>
                                <td>#{u.id_utilisateur}</td>
                                <td><strong>{u.nom} {u.prenom}</strong></td>
                                <td>{u.email}</td>
                                <td>
                                    <span className={`role-badge role-${u.nom_role?.toLowerCase()}`}>
                                        {roleLabels[u.nom_role] || u.nom_role}
                                    </span>
                                </td>
                                <td>{Number(u.actif) === 1 ? (isFR ? '✅ Actif' : '✅ Active') : (isFR ? '❌ Inactif' : '❌ Inactive')}</td>
                                <td>{new Date(u.date_inscription).toLocaleDateString(isFR ? 'fr-FR' : 'en-US')}</td>
                                <td>
                                    <button className="btn-edit" onClick={() => handleEdit(u)} title={isFR ? "Modifier" : "Edit"}>✏️</button>
                                    <button className="btn-delete" onClick={() => handleDelete(u.id_utilisateur)} title={isFR ? "Supprimer" : "Delete"}>🗑️</button>
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
                        <div className="modal-header">
                            <h3>{editingId ? (isFR ? '✏️ Modifier' : '✏️ Edit') : (isFR ? '➕ Créer' : '➕ Create')} {isFR ? "l'utilisateur" : "User"}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <label>{isFR ? "Nom" : "Last Name"}</label>
                                <input name="nom" value={form.nom} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>{isFR ? "Prénom" : "First Name"}</label>
                                <input name="prenom" value={form.prenom} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Email</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>{isFR ? "Mot de passe" : "Password"}</label>
                                <input
                                    name="mot_de_passe"
                                    type="password"
                                    value={form.mot_de_passe}
                                    onChange={handleChange}
                                    placeholder={editingId ? (isFR ? "Laisser vide pour garder l'actuel" : "Leave empty to keep current") : (isFR ? "Requis" : "Required")}
                                    required={!editingId}
                                />
                            </div>
                            <div className="form-row">
                                <label>{isFR ? "Rôle" : "Role"}</label>
                                <select name="nom_role" value={form.nom_role} onChange={handleChange}>
                                    <option value="PUBLIC">{roleLabels['PUBLIC']}</option>
                                    <option value="JURY">{roleLabels['JURY']}</option>
                                    <option value="REALISATEUR">{roleLabels['REALISATEUR']}</option>
                                    <option value="ADMIN">{roleLabels['ADMIN']}</option>
                                </select>
                            </div>
                            <div className="form-row checkbox-row">
                                <input
                                    type="checkbox"
                                    id="actif-checkbox"
                                    name="actif"
                                    checked={form.actif}
                                    onChange={handleToggleActif}
                                />
                                <label htmlFor="actif-checkbox">
                                    {isFR ? "Utilisateur" : "User Active"} : <strong>{isFR ? "Actif" : "Active"}</strong>
                                </label>
                            </div>

                            <div className="form-actions" style={{ marginTop: '20px' }}>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? (isFR ? 'Traitement...' : 'Processing...') : (editingId ? (isFR ? 'Mettre à jour' : 'Update') : (isFR ? 'Créer' : 'Create'))}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                    {isFR ? 'Annuler' : 'Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsersPage;