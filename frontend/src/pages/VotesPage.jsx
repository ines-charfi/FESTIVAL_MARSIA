import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/votes';

function VotesPage({ t, setPage }) {
    const [votes, setVotes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [translatedComments, setTranslatedComments] = useState({});
    const [translatingId, setTranslatingId] = useState(null);

    const [form, setForm] = useState({ id_film: '', id_jury: '', note: '', commentaire: '' });
    const isFR = t.nav_home === "Accueil";

    const fetchVotes = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_URL);
            const data = await res.json();
            setVotes(data);
        } catch { setError(isFR ? 'ERREUR_LIAISON_BDD' : 'DB_LINK_ERROR'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchVotes(); }, []);

    const handleTranslate = async (id, text) => {
        if (!text) return;
        setTranslatingId(id);
        try {
            const res = await fetch("https://libretranslate.de/translate", {
                method: "POST",
                body: JSON.stringify({ q: text, source: "fr", target: "en", format: "text" }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            setTranslatedComments(prev => ({ ...prev, [id]: data.translatedText }));
        } catch { setTranslatedComments(prev => ({ ...prev, [id]: "[!] Traduction Error" })); }
        finally { setTranslatingId(null); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${API_URL}/${editingId}` : API_URL;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setForm({ id_film: '', id_jury: '', note: '', commentaire: '' });
                fetchVotes();
            }
        } catch { alert('Transmission failed'); }
    };

    const openEdit = (v) => {
        setEditingId(v.id_vote);
        setForm({
            id_film: v.id_film,
            id_jury: v.id_jury,
            note: v.note,
            commentaire: v.commentaire || ''
        });
        setShowForm(true);
    };

    return (
        <div className="soumission-page">
            <header className="page-header-cyber">
                <div className="header-text">
                    <h1>📊 {isFR ? "Archives des Votes" : "Voting Archives"}</h1>
                    <p className="user-greeting">[SECURED_ACCESS // DATABASE_VOTES]</p>
                </div>
                <div className="header-actions">
                    <button className="btn-cyber-outline" onClick={() => { setEditingId(null); setForm({id_film:'', id_jury:'', note:'', commentaire:''}); setShowForm(true); }}>
                        + {isFR ? "INJECTER" : "INJECT"}
                    </button>
                    <button className="btn-cyber-exit" onClick={() => setPage('home')}>
                        {isFR ? "QUITTER" : "EXIT"} ↩
                    </button>
                </div>
            </header>

            <div className="votes-stats-bar">
                <div className="stat-item">TOTAL_VOTES: <span>{votes.length}</span></div>
                <div className="stat-item">STATUS: <span>ENCRYPTED</span></div>
            </div>

            <div className="history-cyber-card" style={{ width: '100%', marginTop: '20px' }}>
                <div className="card-glitch-header"><h3>{isFR ? "LISTE DES DÉCISIONS" : "DECISION LIST"}</h3></div>

                <div className="table-responsive-cyber">
                    <table className="admin-table-cyber">
                        <thead>
                        <tr>
                            <th>REF_ID</th>
                            <th>TARGET</th>
                            <th>JURY</th>
                            <th>RATING</th>
                            <th>ANALYSIS</th>
                            <th>ACTIONS</th>
                        </tr>
                        </thead>
                        <tbody>
                        {votes.map((v) => (
                            <tr key={v.id_vote} className="history-item-row">
                                <td data-label="REF_ID">#{v.id_vote}</td>
                                <td data-label="TARGET"><span className="text-cyan-400">🎬 FILM_{v.id_film}</span></td>
                                <td data-label="JURY"><span className="text-pink-400">⚖️ JURY_{v.id_jury}</span></td>
                                <td data-label="RATING">
                                    <div className="cyber-rating-box">
                                        <div className="rating-fill" style={{ width: `${v.note * 10}%` }}></div>
                                        <span className="rating-val">{v.note}/10</span>
                                    </div>
                                </td>
                                <td data-label="ANALYSIS" className="comment-area">
                                    <p>{translatedComments[v.id_vote] || v.commentaire || "NO_DATA"}</p>
                                    {!isFR && v.commentaire && !translatedComments[v.id_vote] && (
                                        <button className="btn-decrypt-mini" onClick={() => handleTranslate(v.id_vote, v.commentaire)}>
                                            {translatingId === v.id_vote ? '...' : '🌐 DECRYPT'}
                                        </button>
                                    )}
                                </td>
                                <td data-label="ACTIONS">
                                    <div className="history-actions">
                                        <button onClick={() => openEdit(v)} className="btn-icon-view">✏️</button>
                                        <button onClick={() => { if(window.confirm('Erase?')) fetch(`${API_URL}/${v.id_vote}`, {method:'DELETE'}).then(fetchVotes)}} className="btn-icon-delete">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODALE AJOUT / MODIF --- */}
            {showForm && (
                <div className="modal-cyber-overlay">
                    <div className="form-cyber-card modal-content">
                        <div className="card-glitch-header">
                            <h3>{editingId ? 'MOD_DATA_STREAM' : 'NEW_DATA_INJECTION'}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid-modal">
                                <div className="input-group">
                                    <label>FILM_ID</label>
                                    <input type="number" value={form.id_film} onChange={(e)=>setForm({...form, id_film:e.target.value})} required />
                                </div>
                                <div className="input-group">
                                    <label>JURY_ID</label>
                                    <input type="number" value={form.id_jury} onChange={(e)=>setForm({...form, id_jury:e.target.value})} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>SCORE (0-10)</label>
                                <input type="number" step="0.1" max="10" value={form.note} onChange={(e)=>setForm({...form, note:e.target.value})} required />
                            </div>
                            <div className="input-group">
                                <label>ANALYSIS_LOG</label>
                                <textarea value={form.commentaire} onChange={(e)=>setForm({...form, commentaire:e.target.value})} rows="4" />
                            </div>
                            <div className="modal-footer-btns">
                                <button type="submit" className="btn-submit-neon">{editingId ? 'UPDATE' : 'INJECT'}</button>
                                <button type="button" className="btn-cyber-exit" onClick={() => setShowForm(false)}>CANCEL</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VotesPage;