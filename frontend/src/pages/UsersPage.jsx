import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api';

function UsersPage({ t }) {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        mot_de_passe: '',
        nom_role: 'PUBLIC',
        actif: true
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isFR = t.nav_home === "Accueil";

    // Mapping pour la traduction des rôles
    const roleMap = {
        'PUBLIC': isFR ? 'Public' : 'Public',
        'JURY': isFR ? 'Jury' : 'Jury',
        'REALISATEUR': isFR ? 'Réalisateur' : 'Director',
        'ADMIN': isFR ? 'Administrateur' : 'Admin'
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
        const { name, value, type, checked } = e.target;
        setForm((f) => ({
            ...f,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const url = editingId ? `${API_URL}/utilisateurs/${editingId}` : `${API_URL}/utilisateurs`;
            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                nom: form.nom,
                prenom: form.prenom,
                email: form.email,
                nom_role: form.nom_role,
                actif: form.actif,
                ...(form.mot_de_passe ? { mot_de_passe: form.mot_de_passe } : {})
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error();

            setForm({ nom: '', prenom: '', email: '', mot_de_passe: '', nom_role: 'PUBLIC', actif: true });
            setEditingId(null);
            fetchUsers();
        } catch (e) {
            setError(isFR ? "Erreur lors de l'enregistrement" : "Save error");
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
            actif: !!user.actif
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isFR ? 'Supprimer cet utilisateur ?' : 'Delete this user?')) return;
        try {
            const res = await fetch(`${API_URL}/utilisateurs/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            fetchUsers();
        } catch (e) {
            setError(isFR ? "Erreur lors de la suppression" : "Delete error");
        }
    };

    return (
        <div className="page-content">
            <h2>👥 {isFR ? 'Utilisateurs' : 'Users'}</h2>

            {error && <div className="error-banner">{error}</div>}

            <form className="card" onSubmit={handleSubmit}>
                <h3>{editingId ? (isFR ? 'Modifier utilisateur' : 'Edit User') : (isFR ? 'Créer utilisateur' : 'Create User')}</h3>
                <div className="form-row">
                    <label>{isFR ? 'Nom' : 'Last Name'}</label>
                    <input name="nom" value={form.nom} onChange={handleChange} required />
                </div>
                <div className="form-row">
                    <label>{isFR ? 'Prénom' : 'First Name'}</label>
                    <input name="prenom" value={form.prenom} onChange={handleChange} required />
                </div>
                <div className="form-row">
                    <label>Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-row">
                    <label>{isFR ? 'Mot de passe' : 'Password'}</label>
                    <input
                        name="mot_de_passe"
                        type="password"
                        value={form.mot_de_passe}
                        onChange={handleChange}
                        placeholder={editingId ? (isFR ? 'Laisser vide pour ne pas changer' : 'Leave empty to keep same') : ''}
                    />
                </div>
                <div className="form-row">
                    <label>{isFR ? 'Rôle' : 'Role'}</label>
                    <select name="nom_role" value={form.nom_role} onChange={handleChange}>
                        {Object.keys(roleMap).map(roleKey => (
                            <option key={roleKey} value={roleKey}>{roleMap[roleKey]}</option>
                        ))}
                    </select>
                </div>
                <div className="form-row checkbox-row">
                    <label>
                        <input type="checkbox" name="actif" checked={form.actif} onChange={handleChange} />
                        {isFR ? 'Actif' : 'Active'}
                    </label>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn-primary">
                        {editingId ? (isFR ? 'Mettre à jour' : 'Update') : (isFR ? 'Créer' : 'Create')}
                    </button>
                    {editingId && (
                        <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm({nom:'', prenom:'', email:'', mot_de_passe:'', nom_role:'PUBLIC', actif: true}); }}>
                            {isFR ? 'Annuler' : 'Cancel'}
                        </button>
                    )}
                </div>
            </form>

            <h3>{isFR ? 'Liste des utilisateurs' : 'Users List'} ({users.length})</h3>

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>{isFR ? 'Nom Complet' : 'Full Name'}</th>
                        <th>Email</th>
                        <th>{isFR ? 'Rôle' : 'Role'}</th>
                        <th>{isFR ? 'Statut' : 'Status'}</th>
                        <th>{isFR ? 'Date d\'inscription' : 'Registration Date'}</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan="7">{isFR ? 'Chargement...' : 'Loading...'}</td></tr>
                    ) : (
                        users.map((u) => (
                            <tr key={u.id_utilisateur}>
                                <td>#{u.id_utilisateur}</td>
                                <td>{u.nom} {u.prenom}</td>
                                <td>{u.email}</td>
                                <td>
                                        <span className={`role-badge role-${u.nom_role?.toLowerCase()}`}>
                                            {roleMap[u.nom_role] || u.nom_role}
                                        </span>
                                </td>
                                <td>{u.actif ? '✅' : '❌'}</td>
                                <td style={{ fontSize: '0.85rem' }}>
                                    {u.date_inscription ? new Date(u.date_inscription).toLocaleString(isFR ? 'fr-FR' : 'en-US', {
                                        year: 'numeric', month: '2-digit', day: '2-digit',
                                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    }) : '-'}
                                </td>
                                <td>
                                    <button className="btn-edit" onClick={() => handleEdit(u)}>✏️</button>
                                    <button className="btn-delete" onClick={() => handleDelete(u.id_utilisateur)}>🗑️</button>
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

export default UsersPage;