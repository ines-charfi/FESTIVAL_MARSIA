import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/v1';

function AdminUsersPage({ setPage }) {
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

    // 🔄 Fetch users
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
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleToggleActif = (e) => {
        setForm(f => ({ ...f, actif: e.target.checked }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);
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
                        actif: form.actif,
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

            // Reset formulaire
            setForm({
                nom: '',
                prenom: '',
                email: '',
                mot_de_passe: '',
                nom_role: 'PUBLIC',
                actif: true
            });
            setEditingId(null);
            setShowForm(false);
            fetchUsers();
        } catch (e) {
            setError("Erreur lors de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    const openCreateForm = () => {
        setEditingId(null);
        setForm({
            nom: '',
            prenom: '',
            email: '',
            mot_de_passe: '',
            nom_role: 'PUBLIC',
            actif: true
        });
        setShowForm(true);
    };

    const handleEdit = (user) => {
        setEditingId(user.id_utilisateur);
        setForm({
            nom: user.nom || '',
            prenom: user.prenom || '',
            email: user.email || '',
            mot_de_passe: '',
            nom_role: user.nom_role || 'PUBLIC',
            actif: user.actif !== false
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet utilisateur ?')) return;

        try {
            const res = await fetch(`${API_URL}/admin/utilisateurs/${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message); // Affiche si supprimé ou seulement désactivé
                fetchUsers(); // 🔄 Rafraîchit la liste pour voir la ❌ ou la disparition
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Erreur de connexion au serveur");
        }
    };

    return (
        <div className="admin-content">
            {/* 📊 CONTENU PRINCIPAL */}
            <div className="page-header">
                <div>
                    <h1>👥 Gestion Utilisateurs</h1>
                    <p>{users.length} utilisateurs trouvés</p>
                </div>
                <div className="page-actions">
                    <button className="btn-primary" onClick={openCreateForm}>
                        ➕ Ajouter utilisateur
                    </button>
                    <button className="btn-home" onClick={() => setPage('home')}>
                        ← Accueil
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* 📋 LISTE UTILISATEURS */}
            <div className="table-section">
                <h3>Liste des utilisateurs ({users.length})</h3>
                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <p>Aucun utilisateur trouvé</p>
                        <button className="btn-primary" onClick={openCreateForm}>
                            ➕ Ajouter le premier
                        </button>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nom complet</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Actif</th>
                                <th>Date création</th>
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
                    {u.nom_role}
                </span>
                                    </td>


                                    <td>{Number(u.actif) === 1 ? '✅' : '❌'}</td>

                                    <td>{new Date(u.date_inscription).toLocaleDateString('fr-FR')}</td>
                                    <td>
                                        <button className="btn-edit" onClick={() => handleEdit(u)}>✏️</button>
                                        <button className="btn-delete" onClick={() => handleDelete(u.id_utilisateur)}>🗑️</button>
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
                            <h3>{editingId ? '✏️ Modifier utilisateur' : '➕ Créer utilisateur'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && <div className="error">{error}</div>}

                            <div className="form-row">
                                <label>Nom *</label>
                                <input name="nom" value={form.nom} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Prénom *</label>
                                <input name="prenom" value={form.prenom} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Email *</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Mot de passe</label>
                                <input
                                    name="mot_de_passe"
                                    type="password"
                                    value={form.mot_de_passe}
                                    onChange={handleChange}
                                    placeholder={editingId ? 'Laisser vide pour ne pas changer' : 'Requis pour création'}
                                />
                            </div>
                            <div className="form-row">
                                <label>Rôle *</label>
                                <select name="nom_role" value={form.nom_role} onChange={handleChange}>
                                    <option value="PUBLIC">PUBLIC</option>
                                    <option value="JURY">JURY</option>
                                    <option value="REALISATEUR">REALISATEUR</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                            <div className="form-row checkbox-row">
                                <label>
                                    <input type="checkbox" name="actif" checked={form.actif} onChange={handleToggleActif} />
                                    Actif
                                </label>
                            </div>

                            <div className="form-actions">
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? '...' : (editingId ? 'Mettre à jour' : 'Créer utilisateur')}
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
    );
}

export default AdminUsersPage;
