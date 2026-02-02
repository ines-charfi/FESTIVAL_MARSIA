import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function UsersPage() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        mot_de_passe: '',
        nom_role: 'PUBLIC',
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/utilisateurs`);
            const data = await res.json();
            setUsers(data);
        } catch (e) {
            setError("Impossible de charger les utilisateurs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingId) {
                // UPDATE
                const res = await fetch(`${API_URL}/utilisateurs/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nom: form.nom,
                        prenom: form.prenom,
                        email: form.email,
                        nom_role: form.nom_role,
                        mot_de_passe: form.mot_de_passe || undefined,
                    }),
                });
                if (!res.ok) throw new Error('Erreur update');
            } else {
                // CREATE
                const res = await fetch(`${API_URL}/utilisateurs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
                if (!res.ok) throw new Error('Erreur création');
            }

            setForm({
                nom: '',
                prenom: '',
                email: '',
                mot_de_passe: '',
                nom_role: 'PUBLIC',
            });
            setEditingId(null);
            fetchUsers();
        } catch (e) {
            setError("Erreur lors de l'enregistrement");
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
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet utilisateur ?')) return;
        try {
            const res = await fetch(`${API_URL}/utilisateurs/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Erreur suppression');
            fetchUsers();
        } catch (e) {
            setError("Erreur lors de la suppression");
        }
    };

    return (
        <div className="page-content">
            <h2>👥 Utilisateurs</h2>

            {error && <div className="error">{error}</div>}

            {/* FORMULAIRE CRUD */}
            <form className="card" onSubmit={handleSubmit}>
                <h3>{editingId ? 'Modifier utilisateur' : 'Créer utilisateur'}</h3>
                <div className="form-row">
                    <label>Nom</label>
                    <input
                        name="nom"
                        value={form.nom}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-row">
                    <label>Prénom</label>
                    <input
                        name="prenom"
                        value={form.prenom}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-row">
                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-row">
                    <label>Mot de passe</label>
                    <input
                        name="mot_de_passe"
                        type="password"
                        value={form.mot_de_passe}
                        onChange={handleChange}
                        placeholder={editingId ? 'Laisser vide pour ne pas changer' : ''}
                    />
                </div>
                <div className="form-row">
                    <label>Rôle</label>
                    <select name="nom_role" value={form.nom_role} onChange={handleChange}>
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="JURY">JURY</option>
                        <option value="REALISATEUR">REALISATEUR</option>
                        <option value="ADMIN">ADMIN</option>
                    </select>
                </div>
                <div className="form-row checkbox-row">
                    <label>
                        <input
                            type="checkbox"
                            name="actif"
                            checked={form.actif}
                            onChange={handleChange}
                        />
                        Actif
                    </label>
                </div>
                <div className="form-actions">
                    <button type="submit">
                        {editingId ? 'Mettre à jour' : 'Créer'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                                setEditingId(null);
                                setForm({
                                    nom: '',
                                    prenom: '',
                                    email: '',
                                    mot_de_passe: '',
                                    nom_role: 'PUBLIC',
                                });
                            }}
                        >
                            Annuler
                        </button>
                    )}
                </div>
            </form>

            {/* LISTE UTILISATEURS */}
            <h3>Liste des utilisateurs ({users.length})</h3>
            {loading ? (
                <div className="loading">Chargement...</div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Actif</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((u) => (
                            <tr key={u.id_utilisateur}>
                                <td>{u.id_utilisateur}</td>
                                <td>{u.nom} {u.prenom}</td>
                                <td>{u.email}</td>
                                <td>
                    <span className={`role-badge role-${u.nom_role?.toLowerCase()}`}>
                      {u.nom_role}
                    </span>
                                </td>
                                <td>{u.actif ? '✅' : '❌'}</td>
                                <td>{new Date(u.date_inscription).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEdit(u)}
                                        title="Modifier"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(u.id_utilisateur)}
                                        title="Supprimer"
                                    >
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
    );
}

export default UsersPage;
