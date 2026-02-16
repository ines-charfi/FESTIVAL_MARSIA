import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import axios from 'axios';



const app = express();

app.use(express.json());
app.use(cors());
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crée le dossier uploads si inexistant
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });


async function initApp() {
    // Connexion MarsAI
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'marsia'
    });

    // UTILISATEURS (CRUD complet)
// GET ALL utilisateurs
    app.get('/api/v1/utilisateurs', async (req, res) => {
        try {
            const [results] = await db.execute(
                'SELECT * FROM utilisateur ORDER BY nom, prenom'
            );
            res.json(results); //  nom_role direct dans table
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// GET utilisateur par ID (avec biographie)
    app.get('/api/v1/utilisateurs/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [results] = await db.execute(`
                SELECT u.*, b.texte_biographie, b.pays_origine
                FROM utilisateur u
                         LEFT JOIN biographie b ON u.id_utilisateur = b.id_utilisateur
                WHERE u.id_utilisateur = ?
            `, [id]);

            if (results.length === 0) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            res.json(results[0]); // nom_role inclus
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// POST nouveau utilisateur
    app.post('/api/v1/utilisateurs', async (req, res) => {
        const { nom, prenom, email, mot_de_passe, nom_role } = req.body;
        try {
            const hash = await bcrypt.hash(mot_de_passe, 10);
            const [result] = await db.execute(
                'INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, nom_role) VALUES (?, ?, ?, ?, ?)',
                [nom, prenom, email, hash, nom_role || 'PUBLIC']
            );

            // On renvoie l'utilisateur créé pour que le frontend puisse le connecter direct
            res.status(201).json({
                id_utilisateur: result.insertId,
                nom, prenom, email, nom_role
            });
        } catch (err) {
            res.status(500).json({ error: "Email déjà utilisé ou erreur serveur" });
        }
    });
    ////////////////////// LOGIN/////////////////////
    app.post('/api/v1/login', async (req, res) => {
        try {
            const { email, mot_de_passe } = req.body;

            const [users] = await db.execute(
                'SELECT * FROM utilisateur WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            const user = users[0];
            const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

            if (!valid) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            // Tout est bon : renvoie infos utilisateur (sans mot_de_passe)
            const { mot_de_passe: _, ...userData } = user;
            res.json({ success: true, user: userData });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });


// PUT modifier utilisateur
    app.put('/api/v1/utilisateurs/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const body = req.body;

            const [existing] = await db.execute(
                'SELECT id_utilisateur FROM utilisateur WHERE id_utilisateur = ?',
                [parseInt(id)]
            );
            if (existing.length === 0) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            const updates = [];
            const values = [];

            const safeAddField = (fieldName, value) => {
                if (value !== undefined && value !== null) {
                    updates.push(`${fieldName} = ?`);
                    values.push(value);
                }
            };

            safeAddField('nom', body.nom);
            safeAddField('prenom', body.prenom);
            safeAddField('email', body.email);
            safeAddField('nom_role', body.nom_role);

            if (body.mot_de_passe) {
                const hash = await bcrypt.hash(body.mot_de_passe, 10);
                updates.push('mot_de_passe = ?');
                values.push(hash);
            }

            if (updates.length === 0) {
                return res.status(400).json({ message: 'Aucun champ à modifier' });
            }

            const [result] = await db.execute(
                `UPDATE utilisateur SET ${updates.join(', ')} WHERE id_utilisateur = ?`,
                [...values, parseInt(id)]
            );

            res.json({
                success: true,
                message: 'Utilisateur modifié !',
                affectedRows: result.affectedRows,
                id: parseInt(id)
            });

        } catch (err) {
            console.error(' ERREUR PUT utilisateur:', err);
            res.status(500).json({ error: err.message });
        }
    });

// DELETE utilisateur
    app.delete('/api/v1/utilisateurs/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const [existing] = await db.execute(
                'SELECT id_utilisateur FROM utilisateur WHERE id_utilisateur = ?',
                [parseInt(id)]
            );
            if (existing.length === 0) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Supprimer seulement biographie
            await db.execute('DELETE FROM biographie WHERE id_utilisateur = ?', [id]);

            const [result] = await db.execute(
                'DELETE FROM utilisateur WHERE id_utilisateur = ?',
                [parseInt(id)]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Erreur suppression' });
            }

            res.json({
                success: true,
                message: 'Utilisateur supprimé !',
                affectedRows: result.affectedRows,
                id: parseInt(id)
            });

        } catch (err) {
            console.error(' ERREUR DELETE utilisateur:', err);
            res.status(500).json({ error: err.message });
        }
    });
/////////=======login ===========///////////:::::
    app.post('/api/v1/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            // On récupère l'utilisateur et son rôle (via une jointure ou si le rôle est dans la table)
            const [users] = await db.execute(
                'SELECT * FROM utilisateur WHERE email = ? AND mot_de_passe = ?',
                [email, password]
            );

            if (users.length > 0) {
                const u = users[0];
                res.json({
                    success: true,
                    user: {
                        id: u.id_utilisateur,
                        prenom: u.prenom,
                        nom: u.nom,
                        nom_role: u.role // Assure-toi que cette colonne existe
                    }
                });
            } else {
                res.status(401).json({ success: false, message: "Identifiants incorrects" });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
////============FILMS===========================================================/////////////////////////

    //GET FILM BY ID
    app.get('/api/v1/films/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [results] = await db.execute(`
                SELECT f.*, u.nom as realisateur_nom, u.prenom as realisateur_prenom
                FROM film f
                         JOIN utilisateur u ON f.id_realisateur = u.id_utilisateur
                WHERE f.id_film = ?
            `, [id]);

            if (results.length === 0) return res.status(404).json({ message: 'Film non trouvé' });
            res.json(results[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    //  FILMS (soumission films)
    // --- DANS index.js ---

// Route pour l'ajout d'un film (Realisateur ou Admin)
// Note: on utilise 'fichier_video' car c'est le nom envoyé par le front
    app.post('/api/v1/films', upload.single('fichier_video'), async (req, res) => {
        try {
            const { id_realisateur, titre, description, lien_youtube, duree_secondes, pays } = req.body;
            const videoPath = req.file ? req.file.path : null;

            // 1. Convertir en nombre (indispensable car FormData envoie du texte)
            const realisateurId = parseInt(id_realisateur);

            // 2. Sécurité : si ce n'est pas un nombre, on renvoie une erreur 400 au lieu de 500
            if (isNaN(realisateurId)) {
                return res.status(400).json({ error: "L'ID du réalisateur est invalide." });
            }

            const query = `
                INSERT INTO film (id_realisateur, titre, description, lien_youtube, duree_secondes, pays, fichier_video, statut_moderation)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'en attente')
            `;

            const [result] = await db.execute(query, [
                realisateurId,
                titre,
                description || '',
                lien_youtube || '',
                parseInt(duree_secondes) || 0,
                pays || '',
                videoPath
            ]);

            res.status(201).json({ success: true, id_film: result.insertId });
        } catch (err) {
            console.error("ERREUR SQL:", err.message);
            res.status(500).json({ error: err.message });
        }
    });
// Route GET filtrée pour que le réalisateur uploader ses films
    app.get('/api/v1/films', async (req, res) => {
        const { utilisateurId } = req.query;
        try {
            let query = 'SELECT * FROM film';
            let params = [];

            if (utilisateurId) {
                query += ' WHERE id_realisateur = ?';
                params.push(utilisateurId);
            }

            const [results] = await db.execute(query, params);
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
// PATCH film (modifier 1 champ seulement)
    app.patch('/api/v1/films/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { statut_moderation } = req.body;

            const [result] = await db.execute(
                `UPDATE film SET statut_moderation = ? WHERE id_film = ?`,
                [statut_moderation, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Film non trouvé' });
            }

            res.json({
                success: true,
                message: 'Statut film modifié !',
                affectedRows: result.affectedRows
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
// PUT film par ID (Adapté pour upload et Solution B)
// Route PUT pour modifier un film (avec gestion de fichier et Solution B)
    app.put('/api/v1/films/:id', upload.single('fichier_video'), async (req, res) => {
        try {
            const { id } = req.params;
            const { id_realisateur, titre, description, lien_youtube, duree_secondes, pays } = req.body;

            // 1. Vérifier si le film existe
            const [existing] = await db.execute('SELECT fichier_video FROM film WHERE id_film = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Film non trouvé' });
            }

            // 2. Sécurité Solution B : Conversion de l'ID réalisateur
            const realisateurId = parseInt(id_realisateur);
            if (isNaN(realisateurId)) {
                return res.status(400).json({ error: "L'ID du réalisateur est invalide." });
            }

            // 3. Gestion du fichier vidéo :
            // Si un nouveau fichier est uploadé, on prend req.file.path
            // Sinon, on garde l'ancien chemin qui est déjà dans la base (existing[0].fichier_video)
            const currentVideo = req.file ? req.file.path : existing[0].fichier_video;

            // 4. Exécution de la mise à jour
            // ATTENTION : 'en attente' doit être en minuscules pour l'ENUM
            const query = `
                UPDATE film SET
                                id_realisateur = ?,
                                titre = ?,
                                description = ?,
                                lien_youtube = ?,
                                duree_secondes = ?,
                                pays = ?,
                                fichier_video = ?,
                                statut_moderation = 'en attente'
                WHERE id_film = ?
            `;

            const [result] = await db.execute(query, [
                realisateurId,
                titre,
                description || '',
                lien_youtube || '',
                parseInt(duree_secondes) || 0,
                pays || '',
                currentVideo,
                id
            ]);

            res.json({
                success: true,
                message: 'Film mis à jour avec succès !',
                affectedRows: result.affectedRows
            });

        } catch (err) {
            console.error("ERREUR PUT FILM:", err);
            res.status(500).json({ error: "Erreur serveur : " + err.message });
        }
    });
// DELETE film par ID
    app.delete('/api/v1/films/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Vérifier existence
            const [existing] = await db.execute('SELECT id_film FROM film WHERE id_film = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ message: 'Film non trouvé' });
            }

            const [result] = await db.execute('DELETE FROM film WHERE id_film = ?', [id]);

            res.json({
                success: true,
                message: 'Film supprimé !',
                affectedRows: result.affectedRows
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });


    //  VOTES (jury)
    // GET tous les votes OU votes d’un jury
    app.get('/api/v1/votes', async (req, res) => {
        try {
            const juryId = req.query.jury;

            let query = `
            SELECT 
                v.id_vote,
                v.note,
                v.commentaire,
                v.id_film,
                v.id_jury,
                f.titre as film_titre,
                u.nom as jury_nom,
                u.prenom as jury_prenom
            FROM vote v
            JOIN film f ON v.id_film = f.id_film
            JOIN utilisateur u ON v.id_jury = u.id_utilisateur
        `;

            const params = [];

            if (juryId) {
                query += ' WHERE v.id_jury = ?';
                params.push(juryId);
            }

            query += ' ORDER BY v.id_vote DESC';

            const [results] = await db.execute(query, params);
            res.json(results);

        } catch (err) {
            console.error("Erreur SQL:", err.message);
            res.status(500).json({ error: err.message });
        }
    });


// GET un vote par ID
    app.get('/api/v1/votes/:id', async (req, res) => {
        try {
            const juryId = req.query.jury;

            let query = `
            SELECT 
                v.id_vote,
                v.note,
                v.commentaire,
                v.id_film,
                v.id_jury,
                f.titre as film_titre,
                u.nom as jury_nom,
                u.prenom as jury_prenom
            FROM vote v
            JOIN film f ON v.id_film = f.id_film
            JOIN utilisateur u ON v.id_jury = u.id_utilisateur
        `;
            const params = [];

            if (juryId) {
                query += ' WHERE v.id_jury = ?';
                params.push(juryId);
            }

            query += ' ORDER BY v.id_vote DESC';

            const [results] = await db.execute(query, params);
            res.json(results);
        } catch (err) {
            console.error("Erreur SQL:", err.message);
            res.status(500).json({ error: err.message });
        }
    });

    //POST VOTES
    app.post('/api/v1/votes', async (req, res) => {
        try {
            const { id_film, id_jury, note, commentaire } = req.body;

            const filmId = parseInt(id_film);
            const juryId = parseInt(id_jury);
            const noteValue = parseFloat(note);

            if (
                isNaN(filmId) || filmId <= 0 ||
                isNaN(juryId) || juryId <= 0 ||
                isNaN(noteValue) || noteValue < 0 || noteValue > 10
            ) {
                return res.status(400).json({
                    error: "Données invalides (film, jury ou note)"
                });
            }

            // Vérifier film
            const [filmExist] = await db.execute(
                'SELECT id_film FROM film WHERE id_film = ?',
                [filmId]
            );
            if (filmExist.length === 0) {
                return res.status(400).json({ error: "Film inexistant" });
            }

            // Vérifier jury
            const [juryExist] = await db.execute(
                'SELECT id_utilisateur FROM utilisateur WHERE id_utilisateur = ?',
                [juryId]
            );
            if (juryExist.length === 0) {
                return res.status(400).json({ error: "Jury inexistant" });
            }

            // Vérifier déjà voté
            const [existingVote] = await db.execute(
                'SELECT id_vote FROM vote WHERE id_film = ? AND id_jury = ?',
                [filmId, juryId]
            );
            if (existingVote.length > 0) {
                return res.status(400).json({
                    error: "Vous avez déjà voté pour ce film"
                });
            }

            const [result] = await db.execute(
                `INSERT INTO vote (id_film, id_jury, note, commentaire)
             VALUES (?, ?, ?, ?)`,
                [filmId, juryId, noteValue, commentaire || ""]
            );

            res.status(201).json({
                success: true,
                id_vote: result.insertId
            });

        } catch (err) {
            console.error("ERREUR INSERTION:", err.message);
            res.status(500).json({ error: err.message });
        }
    });


// PUT modifier un vote
    app.put('/api/v1/votes/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { note, commentaire } = req.body;

            // Vérifier existence
            const [existing] = await db.execute('SELECT id_vote FROM vote WHERE id_vote = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ message: 'Vote non trouvé' });
            }

            const [result] = await db.execute(
                `UPDATE vote SET note = ?, commentaire = ? WHERE id_vote = ?`,
                [note, commentaire, id]
            );

            res.json({
                success: true,
                message: 'Vote modifié !',
                affectedRows: result.affectedRows
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
// DELETE un vote
    app.delete('/api/v1/votes/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Vérifier existence
            const [existing] = await db.execute('SELECT id_vote FROM vote WHERE id_vote = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ message: 'Vote non trouvé' });
            }

            const [result] = await db.execute('DELETE FROM vote WHERE id_vote = ?', [id]);

            res.json({
                success: true,
                message: 'Vote supprimé !',
                affectedRows: result.affectedRows
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // ========== 🔐 ADMIN CRUD UTILISATEURS ==========
    app.get('/api/v1/admin/utilisateurs', async (req, res) => {
        try {
            const [results] = await db.execute(`
            SELECT u.*, 
                   (SELECT COUNT(*) FROM film f WHERE f.id_realisateur = u.id_utilisateur) as nb_films,
                   (SELECT COUNT(*) FROM vote v WHERE v.id_jury = u.id_utilisateur) as nb_votes
            FROM utilisateur u 
            ORDER BY u.date_inscription DESC
        `);
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/v1/admin/utilisateurs', async (req, res) => {
        try {
            const { nom, prenom, email, mot_de_passe, nom_role = 'PUBLIC' } = req.body;
            const hash = await bcrypt.hash(mot_de_passe, 10);

            const [result] = await db.execute(
                `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, nom_role, actif) 
             VALUES (?, ?, ?, ?, ?, 1)`,
                [nom, prenom, email, hash, nom_role]
            );

            res.status(201).json({
                success: true,
                id: result.insertId,
                message: 'Admin: Utilisateur créé !'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.put('/api/v1/admin/utilisateurs/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { nom, prenom, email, nom_role, actif } = req.body;

            const [result] = await db.execute(
                `UPDATE utilisateur 
             SET nom = ?, prenom = ?, email = ?, nom_role = ?, actif = ?
             WHERE id_utilisateur = ?`,
                [nom, prenom, email, nom_role, actif, id]
            );

            res.json({
                success: true,
                message: 'Admin: Utilisateur modifié !',
                affectedRows: result.affectedRows
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/v1/admin/utilisateurs/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Supprimer dépendances en cascade
            await db.execute('DELETE FROM biographie WHERE id_utilisateur = ?', [id]);
            await db.execute('DELETE FROM notification WHERE id_utilisateur = ?', [id]);

            const [result] = await db.execute('DELETE FROM utilisateur WHERE id_utilisateur = ?', [id]);
            res.json({
                success: true,
                message: 'Admin: Utilisateur supprimé !',
                affectedRows: result.affectedRows
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// ==========  ADMIN CRUD ÉVÉNEMENTS ==========
    app.get('/api/v1/admin/evenements', async (req, res) => {
        try {
            const [results] = await db.execute(`
            SELECT e.*, 
                   (SELECT COUNT(*) FROM reservation r WHERE r.id_evenement = e.id_evenement) as nb_reservations
            FROM evenement e 
            ORDER BY e.date_heure ASC
        `);
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/v1/admin/evenements', async (req, res) => {
        try {
            const { titre, description, date_heure, lieu, capacite_max = 100 } = req.body;
            const [result] = await db.execute(
                `INSERT INTO evenement (titre, description, date_heure, lieu, capacite_max)
             VALUES (?, ?, ?, ?, ?)`,
                [titre, description, date_heure, lieu, capacite_max]
            );
            res.status(201).json({
                success: true,
                id_evenement: result.insertId,
                message: 'Admin: Événement créé !'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.put('/api/v1/admin/evenements/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { titre, description, date_heure, lieu, capacite_max } = req.body;

            const [result] = await db.execute(
                `UPDATE evenement 
             SET titre = ?, description = ?, date_heure = ?, lieu = ?, capacite_max = ?
             WHERE id_evenement = ?`,
                [titre, description, date_heure, lieu, capacite_max, id]
            );

            res.json({
                success: true,
                message: 'Admin: Événement modifié !',
                affectedRows: result.affectedRows
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/v1/admin/evenements/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Supprimer réservations associées
            await db.execute('DELETE FROM reservation WHERE id_evenement = ?', [id]);

            const [result] = await db.execute('DELETE FROM evenement WHERE id_evenement = ?', [id]);
            res.json({
                success: true,
                message: 'Admin: Événement supprimé !',
                affectedRows: result.affectedRows
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// ========== DASHBOARD ADMIN ==========
    app.get('/api/v1/admin/stats', async (req, res) => {
        try {
            const [
                [utilisateurs],
                [films],
                [votes],
                [newsletters],
                [notifications],
                [outils_ia]

            ] = await Promise.all([
                db.execute('SELECT COUNT(*) as total FROM utilisateur'),
                db.execute('SELECT COUNT(*) as total FROM film'),
                db.execute('SELECT COUNT(*) as total FROM vote'),
                db.execute('SELECT COUNT(*) as total FROM newsletter'),
                db.execute('SELECT COUNT(*) as total FROM notification'),
                 db.execute('SELECT COUNT(*) as total FROM outil_ia')
            ]);

            res.json({
                success: true,
                stats: {
                    utilisateurs: utilisateurs[0].total,
                    films: films[0].total,
                    votes: votes[0].total,
                    newsletters: newsletters[0].total,
                    notifications:notifications[0].total,
                    outils_ia: outils_ia[0].total,

                },
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });


    // ADMIN - Modérer film
    // ✅ Valider ou refuser un film (ADMIN)
    app.put('/api/v1/films/:id/validation', async (req, res) => {
        try {
            const { id } = req.params;
            const { statut_moderation } = req.body;

            // Vérifie que le statut est correct
            if (!['VALIDE', 'REFUSE'].includes(statut_moderation)) {
                return res.status(400).json({ message: 'Statut invalide' });
            }

            // Met à jour le statut du film
            const [result] = await db.execute(
                'UPDATE film SET statut_moderation = ? WHERE id_film = ?',
                [statut_moderation, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Film non trouvé' });
            }

            // Retourne le nouveau statut
            res.json({ success: true, id_film: id, statut_moderation });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    });

///=================modifier film =============================/////
// backend/index.js
    app.put('/api/v1/films/:id', async (req, res) => {
        const { id } = req.params;
        const { titre, description, lien_youtube, pays } = req.body;

        try {
            const query = `
            UPDATE film 
            SET titre = ?, description = ?, lien_youtube = ?, pays = ?
            WHERE id_film = ?
        `;
            const [result] = await db.execute(query, [titre, description, lien_youtube, pays, id]);

            res.json({ success: true, message: "Film mis à jour" });
        } catch (err) {
            console.error("ERREUR SQL:", err.message); // Regarde ton terminal Node pour voir ce message !
            res.status(500).json({ error: err.message });
        }
    });
    // ========== EVENEMENTS ==========

// GET tous les événements
    app.get('/api/v1/evenements', async (req, res) => {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM evenement ORDER BY date_heure ASC'
            );
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// GET un événement par ID
    app.get('/api/v1/evenements/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.execute(
                'SELECT * FROM evenement WHERE id_evenement = ?',
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ message: 'Événement non trouvé' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// POST créer un événement
    app.post('/api/v1/evenements', async (req, res) => {
        try {
            const { titre, description, date_heure, lieu } = req.body;
            const [result] = await db.execute(
                `INSERT INTO evenement (titre, description, date_heure, lieu)
         VALUES (?, ?, ?, ?)`,
                [titre, description, date_heure, lieu]
            );
            res.status(201).json({ success: true, id_evenement: result.insertId });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// PUT mettre à jour un événement
    app.put('/api/v1/evenements/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { titre, description, date_heure, lieu } = req.body;
            const [result] = await db.execute(
                `UPDATE evenement
         SET titre = ?, description = ?, date_heure = ?, lieu = ?
         WHERE id_evenement = ?`,
                [titre, description, date_heure, lieu, id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// DELETE un événement
    app.delete('/api/v1/evenements/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(
                'DELETE FROM evenement WHERE id_evenement = ?',
                [id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
// ========== RESERVATIONS ==========

// GET toutes les réservations (optionnel ?id_utilisateur=)
    app.get('/api/v1/reservations', async (req, res) => {
        try {
            const { id_utilisateur } = req.query;
            let sql = `
        SELECT r.*, e.titre, e.date_heure, e.lieu
        FROM reservation r
        JOIN evenement e ON r.id_evenement = e.id_evenement
      `;
            const params = [];
            if (id_utilisateur) {
                sql += ' WHERE r.id_utilisateur = ?';
                params.push(id_utilisateur);
            }
            const [rows] = await db.execute(sql, params);
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// GET une réservation par ID
    app.get('/api/v1/reservations/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.execute(
                `SELECT r.*, e.titre, e.date_heure, e.lieu
         FROM reservation r
         JOIN evenement e ON r.id_evenement = e.id_evenement
         WHERE r.id_reservation = ?`,
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ message: 'Réservation non trouvée' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// POST créer une réservation
    app.post('/api/v1/reservations', async (req, res) => {
        try {
            const { id_utilisateur, id_evenement, nb_places = 1 } = req.body;
            const [result] = await db.execute(
                `INSERT INTO reservation (id_utilisateur, id_evenement, nb_places)
         VALUES (?, ?, ?)`,
                [id_utilisateur, id_evenement, nb_places]
            );
            res.status(201).json({ success: true, id_reservation: result.insertId });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// PUT mise à jour d’une réservation
    app.put('/api/v1/reservations/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { nb_places } = req.body;
            const [result] = await db.execute(
                `UPDATE reservation
         SET nb_places = ?
         WHERE id_reservation = ?`,
                [nb_places, id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// DELETE une réservation
    app.delete('/api/v1/reservations/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(
                'DELETE FROM reservation WHERE id_reservation = ?',
                [id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
// ========== NEWSLETTER ==========

// GET toutes les inscriptions newsletter
    app.get('/api/v1/newsletter', async (req, res) => {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM newsletter ORDER BY date_inscription DESC'
            );
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// GET une inscription par ID
    app.get('/api/v1/newsletter/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.execute(
                'SELECT * FROM newsletter WHERE id_news = ?',
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ message: 'Inscription non trouvée' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// POST nouvelle inscription
    app.post('/api/v1/newsletter', async (req, res) => {
        try {
            const { email, langue = 'FR' } = req.body;

            const [result] = await db.execute(
                `INSERT INTO newsletter (email, langue)
                 VALUES (?, ?)`,
                [email, langue]
            );
            res.status(201).json({ success: true, id_news: result.insertId });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    ///////://///////////////////////////
    // Route pour s'inscrire à la newsletter
    app.post('/api/v1/newsletter', async (req, res) => {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "L'email est requis" });
        }

        try {
            // On insère l'email dans la table newsletter
            // Vérifie bien que ta table s'appelle 'newsletter' et possède une colonne 'email'
            await db.execute('INSERT INTO newsletter (email) VALUES (?)', [email]);

            res.status(201).json({ success: true, message: "Email enregistré !" });
        } catch (err) {
            // Si l'email existe déjà (si tu as mis une contrainte UNIQUE)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "Cet email est déjà inscrit." });
            }
            res.status(500).json({ error: err.message });
        }
    });


// PUT mise à jour newsletter
    app.put('/api/v1/newsletter/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { langue, confirme } = req.body;
            const [result] = await db.execute(
                `UPDATE newsletter  
             SET langue = ?, confirme = ?
             WHERE id_news = ?`,
                [langue, confirme, id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// DELETE une inscription
    app.delete('/api/v1/newsletter/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(
                'DELETE FROM newsletter WHERE id_news = ?',
                [id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// ========== NOTIFICATIONS ==========

// GET toutes les notifications (optionnel ?id_utilisateur=)
    app.get('/api/v1/notifications', async (req, res) => {
        try {
            const { id_utilisateur } = req.query;
            let sql = 'SELECT * FROM notification';
            const params = [];
            if (id_utilisateur) {
                sql += ' WHERE id_utilisateur = ?';
                params.push(id_utilisateur);
            }
            sql += ' ORDER BY date_envoi DESC';
            const [rows] = await db.execute(sql, params);
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// GET une notification
    app.get('/api/v1/notifications/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.execute(
                'SELECT * FROM notification WHERE id_notification = ?',
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ message: 'Notification non trouvée' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// POST créer notification
    app.post('/api/v1/notifications', async (req, res) => {
        try {
            const { id_utilisateur, type_notification, contenu } = req.body;
            const [result] = await db.execute(
                `INSERT INTO notification (id_utilisateur, type_notification, contenu)
         VALUES (?, ?, ?)`,
                [id_utilisateur, type_notification, contenu]
            );
            res.status(201).json({ success: true, id_notification: result.insertId });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// PUT mettre à jour (contenu, type, lu)
    app.put('/api/v1/notifications/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { type_notification, contenu, lu } = req.body;
            const [result] = await db.execute(
                `UPDATE notification
         SET type_notification = ?, contenu = ?, lu = ?
         WHERE id_notification = ?`,
                [type_notification, contenu, lu, id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// DELETE notification
    app.delete('/api/v1/notifications/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(
                'DELETE FROM notification WHERE id_notification = ?',
                [id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// ========== OUTILS IA ==========

// GET tous les outils
    app.get('/api/v1/outils-ia', async (req, res) => {
        try {
            const [rows] = await db.execute('SELECT * FROM outil_ia ORDER BY nom_outil ASC');
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// GET un outil_ia
    app.get('/api/v1/outils-ia/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.execute(
                'SELECT * FROM outil_ia WHERE id_outil = ?',
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ message: 'Outil IA non trouvé' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// POST créer outil
    app.post('/api/v1/outils-ia', async (req, res) => {
        try {
            const { nom_outil, type_outil } = req.body;
            const [result] = await db.execute(
                `INSERT INTO outil_ia (nom_outil, type_outil)
         VALUES (?, ?)`,
                [nom_outil, type_outil]
            );
            res.status(201).json({ success: true, id_outil: result.insertId });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// PUT mettre à jour outil
    app.put('/api/v1/outils-ia/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { nom_outil, type_outil } = req.body;
            const [result] = await db.execute(
                `UPDATE outil_ia
         SET nom_outil = ?, type_outil = ?
         WHERE id_outil = ?`,
                [nom_outil, type_outil, id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// DELETE outil
    app.delete('/api/v1/outils-ia/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(
                'DELETE FROM outil_ia WHERE id_outil = ?',
                [id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// Association film ↔ outils IA
// GET outils d’un film
    app.get('/api/v1/films/:id/outils-ia', async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.execute(
                `SELECT foi.*, o.nom_outil, o.type_outil
         FROM film_outil_ia foi
         JOIN outil_ia o ON foi.id_outil = o.id_outil
         WHERE foi.id_film = ?`,
                [id]
            );
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// POST associer un outil à un film
    app.post('/api/v1/films/:id/outils-ia', async (req, res) => {
        try {
            const { id } = req.params;
            const { id_outil, version, commentaire } = req.body;

            // Vérification existence film
            const [film] = await db.execute('SELECT id_film FROM film WHERE id_film = ?', [id]);
            if (film.length === 0) {
                return res.status(404).json({ message: 'Film non trouvé' });
            }

            // Vérification existence outil
            const [outil] = await db.execute('SELECT id_outil FROM outil_ia WHERE id_outil = ?', [id_outil]);
            if (outil.length === 0) {
                return res.status(404).json({ message: 'Outil IA non trouvé' });
            }

            // Vérifications champs obligatoires
            if (id_outil === undefined || id_outil === null || version === undefined || version === null) {
                return res.status(400).json({
                    error: "id_outil et version sont obligatoires"
                });
            }

            // INSERT avec valeurs safe
            const [result] = await db.execute(
                `INSERT INTO film_outil_ia (id_film, id_outil, version, commentaire)
             VALUES (?, ?, ?, ?)`,
                [parseInt(id), parseInt(id_outil), version, commentaire || null]
            );

            res.status(201).json({
                success: true,
                message: 'Outil associé au film !',
                id_film: parseInt(id),
                id_outil: parseInt(id_outil)
            });

        } catch (err) {
            console.error('ERREUR association film-outil:', err);
            res.status(500).json({ error: err.message });
        }
    });

// DELETE lien film-outil
    app.delete('/api/v1/films/:id/outils-ia/:id_outil', async (req, res) => {
        try {
            const { id, id_outil } = req.params;
            const [result] = await db.execute(
                'DELETE FROM film_outil_ia WHERE id_film = ? AND id_outil = ?',
                [id, id_outil]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    //====================CRUD FILMS/USER==============================//

// ========== BIOGRAPHIE ==========

// GET biographie d’un utilisateur
    // Route pour récupérer la bio
    app.get('/api/v1/biographie/:id', async (req, res) => {
        try {
            const [rows] = await db.execute('SELECT * FROM biographie WHERE id_utilisateur = ?', [req.params.id]);
            res.json(rows[0] || {});
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// Route pour sauvegarder/modifier la bio (avec Multer pour la photo)
    app.post('/api/v1/biographie', upload.single('photo_profil'), async (req, res) => {
        const { id_utilisateur, nom, prenom, biographie, lien_site, reseaux_sociaux } = req.body;
        const photo_path = req.file ? req.file.path : null;

        try {
            // On utilise ON DUPLICATE KEY UPDATE si id_utilisateur est une clé unique
            const query = `
            INSERT INTO biographie (id_utilisateur, nom, prenom, biographie, lien_site, reseaux_sociaux, photo_profil)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            nom=?, prenom=?, biographie=?, lien_site=?, reseaux_sociaux=?, photo_profil=COALESCE(?, photo_profil)
        `;

            await db.execute(query, [
                id_utilisateur, nom, prenom, biographie, lien_site, reseaux_sociaux, photo_path,
                nom, prenom, biographie, lien_site, reseaux_sociaux, photo_path
            ]);

            res.json({ success: true, message: "Bio mise à jour" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
// POST créer biographie
    app.post('/api/v1/utilisateurs/:id/biographie', async (req, res) => {
        try {
            const { id } = req.params;
            const { texte_biographie, site_officiel, pays_origine } = req.body;
            const [result] = await db.execute(
                `INSERT INTO biographie (id_utilisateur, texte_biographie, site_officiel, pays_origine)
         VALUES (?, ?, ?, ?)`,
                [id, texte_biographie, site_officiel, pays_origine]
            );
            res.status(201).json({ success: true, id_biographie: result.insertId });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// PUT mettre à jour biographie
    app.put('/api/v1/utilisateurs/:id/biographie', async (req, res) => {
        try {
            const { id } = req.params;
            const { texte_biographie, site_officiel, pays_origine } = req.body;
            const [result] = await db.execute(
                `UPDATE biographie
         SET texte_biographie = ?, site_officiel = ?, pays_origine = ?
         WHERE id_utilisateur = ?`,
                [texte_biographie, site_officiel, pays_origine, id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

// DELETE biographie
    app.delete('/api/v1/utilisateurs/:id/biographie', async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(
                'DELETE FROM biographie WHERE id_utilisateur = ?',
                [id]
            );
            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    //

    app.post('/api/v1/admin/verifier-film', async (req, res) => {
        const { videoUrl, id_film } = req.body;

        try {
            // 1. Appel à l'API de modération
            const response = await axios.get('https://api.sightengine.com/1.0/video/check.json', {
                params: {
                    'stream_url': videoUrl,
                    'models': 'nudity,wad,offensive', // wad = weapons, alcohol, drugs
                    'api_user': 'TON_API_USER',
                    'api_secret': 'TON_API_SECRET'
                }
            });

            const data = response.data;

            // 2. Logique de décision
            // Si le score d'alcool ou de nudité est trop élevé (> 0.5)
            if (data.summary.action === 'reject') {
                await db.execute('UPDATE film SET statut = "rejete", motif = "Non conforme" WHERE id_film = ?', [id_film]);
                return res.json({ success: false, message: "Film non conforme détecté par l'IA." });
            }

            // 3. Si tout est OK
            await db.execute('UPDATE film SET statut = "conforme" WHERE id_film = ?', [id_film]);
            res.json({ success: true, message: "Film vérifié et conforme." });

        } catch (err) {
            res.status(500).json({ error: "Erreur lors de l'analyse vidéo" });
        }
    });

    app.listen(8081, () => {
        console.log('🚀 MarsAI Backend: http://localhost:8081');
        console.log(' TOUTES routes + DB chargées !');
    });
}

initApp().catch(console.error);
