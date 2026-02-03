import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';

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
        try {
            const { nom, prenom, email, mot_de_passe, nom_role = 'PUBLIC' } = req.body;

            const hash = await bcrypt.hash(mot_de_passe, 10);

            const [result] = await db.execute(
                `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, nom_role, date_inscription, actif) 
             VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
                [nom, prenom, email, hash, nom_role]
            );

            res.status(201).json({
                success: true,
                id: result.insertId,
                message: 'Utilisateur créé !'
            });
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
    app.post('/api/v1/films', upload.single('fichier_video'), async (req, res) => {
        try {
            const { id_realisateur, titre, description, lien_youtube, duree_secondes, pays } = req.body;

            if (!id_realisateur || !titre) {
                return res.status(400).json({ message: 'id_realisateur et titre obligatoires' });
            }

            const fichier_video = req.file ? req.file.filename : null;

            const [result] = await db.execute(
                `INSERT INTO film (id_realisateur, titre, description, lien_youtube, duree_secondes, pays, fichier_video, statut_moderation)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'en attente')`,
                [id_realisateur, titre, description || null, lien_youtube || null, duree_secondes || null, pays || null, fichier_video]
            );

            res.status(201).json({
                success: true,
                id_film: result.insertId,
                message: 'Film soumis avec succès !'
            });
        } catch (err) {
            console.error('ERREUR soumission film:', err);
            res.status(500).json({ error: err.message });
        }
    });


    // GET films (pour jury/participants)
    app.get('/api/v1/films', async (req, res) => {
        try {
            const { statut } = req.query;
            let query = `
        SELECT f.*, u.nom as realisateur_nom, u.prenom as realisateur_prenom
        FROM film f 
        JOIN utilisateur u ON f.id_realisateur = u.id_utilisateur
      `;
            const params = [];

            if (statut) {
                query += ` WHERE statut_moderation = ?`;
                params.push(statut);
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
// PUT film par ID (modifier TOUS les champs)
    app.put('/api/v1/films/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { id_realisateur, titre, description, lien_youtube, duree_secondes, pays } = req.body;

            // Vérifier existence
            const [existing] = await db.execute('SELECT id_film FROM film WHERE id_film = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ message: 'Film non trouvé' });
            }

            const [result] = await db.execute(
                `UPDATE film SET 
             id_realisateur = ?, titre = ?, description = ?, lien_youtube = ?, 
             duree_secondes = ?, pays = ?, statut_moderation = ?
             WHERE id_film = ?`,
                [id_realisateur, titre, description, lien_youtube, duree_secondes, pays, 'en attente', id]
            );

            res.json({
                success: true,
                message: 'Film modifié !',
                affectedRows: result.affectedRows
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
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
    // GET tous les votes
    app.get('/api/v1/votes', async (req, res) => {
        try {
            const { id_jury, id_film } = req.query;
            let sql = `
            SELECT v.*, f.titre as film_titre, u.nom as jury_nom, u.prenom as jury_prenom
            FROM vote v
            JOIN film f ON v.id_film = f.id_film
            JOIN utilisateur u ON v.id_jury = u.id_utilisateur
        `;
            const params = [];

            if (id_jury) {
                sql += ' WHERE v.id_jury = ?';
                params.push(id_jury);
            } else if (id_film) {
                sql += ' WHERE v.id_film = ?';
                params.push(id_film);
            }

            sql += ' ORDER BY v.id_vote DESC';
            const [results] = await db.execute(sql, params);
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
// GET un vote par ID
    app.get('/api/v1/votes/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [results] = await db.execute(`
                SELECT v.*, f.titre as film_titre, u.nom as jury_nom, u.prenom as jury_prenom
                FROM vote v
                         JOIN film f ON v.id_film = f.id_film
                         JOIN utilisateur u ON v.id_jury = u.id_utilisateur
                WHERE v.id_vote = ?
            `, [id]);

            if (results.length === 0) {
                return res.status(404).json({ message: 'Vote non trouvé' });
            }
            res.json(results[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    //POST VOTES
    app.post('/api/v1/votes', async (req, res) => {
        try {
            const { id_film, id_jury, note, commentaire } = req.body;

            const [result] = await db.execute(
                `INSERT INTO vote (id_film, id_jury, note, commentaire) VALUES (?, ?, ?, ?)`,
                [id_film, id_jury, note, commentaire]
            );

            res.status(201).json({ success: true, id_vote: result.insertId });
        } catch (err) {
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
            ] = await Promise.all([
                db.execute('SELECT COUNT(*) as total FROM utilisateur'),
                db.execute('SELECT COUNT(*) as total FROM film'),
                db.execute('SELECT COUNT(*) as total FROM vote'),
                db.execute('SELECT COUNT(*) as total FROM newsletter'),
            ]);

            res.json({
                success: true,
                stats: {
                    utilisateurs: utilisateurs[0].total,
                    films: films[0].total,
                    votes: votes[0].total,
                    newsletters: newsletters[0].total,

                },
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });


    // ADMIN - Modérer film
    app.put('/api/v1/admin/films/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { statut_moderation } = req.body;

            const [result] = await db.execute(
                `UPDATE film SET statut_moderation = ? WHERE id_film = ?`,
                [statut_moderation, id]
            );

            res.json({ success: true, affectedRows: result.affectedRows });
        } catch (err) {
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
    app.get('/api/v1/utilisateurs/:id/biographie', async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.execute(
                'SELECT * FROM biographie WHERE id_utilisateur = ?',
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ message: 'Biographie non trouvée' });
            res.json(rows[0]);
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

    app.listen(8081, () => {
        console.log('🚀 MarsAI Backend: http://localhost:8081');
        console.log(' TOUTES routes + DB chargées !');
    });
}

initApp().catch(console.error);
