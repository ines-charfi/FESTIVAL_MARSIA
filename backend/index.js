import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Utilisation de l'import moderne


dotenv.config();


const app = express();
app.use(express.json());
app.use(cors());


// 1. Configuration du client Scaleway S3 selon la documentation [cite: 13]
const s3Client = new S3Client({
    region: process.env.SCALEWAY_REGION, // "fr-par" [cite: 13]
    endpoint: process.env.SCALEWAY_ENDPOINT, // "https://s3.fr-par.scw.cloud" [cite: 13]
    credentials: {
        accessKeyId: process.env.SCALEWAY_ACCESS_KEY, // "SCW3MFQBR803FXZS4N33" [cite: 13]
        secretAccessKey: process.env.SCALEWAY_SECRET_KEY, // "c64db8bf-f541-478d-aa6a-cbcb8c7be2ae" [cite: 13]
    },
});


// 2. Configuration de Multer en mémoire (plus rapide pour S3)
const storage = multer.memoryStorage();
const upload = multer({ storage });


async function initApp() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log(`✅ Connecté à la base de données ${process.env.DB_NAME}`);


        // 3. Route d'upload adaptée pour Martigues
        app.post('/api/upload', upload.single('video'), async (req, res) => {
            try {
                if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });


                // Construction du nom du fichier avec ton dossier groupe [cite: 9, 29]
                const folder = process.env.SCALEWAY_FOLDER; // Ex: grp2 [cite: 26]
                const fileName = `${folder}/${Date.now()}-${req.file.originalname}`;


                const params = {
                    Bucket: process.env.SCALEWAY_BUCKET_NAME, // "mrt" [cite: 13, 28]
                    Key: fileName,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                    ACL: "public-read", // Les fichiers sont publics en lecture
                };


                // Envoi vers Scaleway
                await s3Client.send(new PutObjectCommand(params));


                // URL publique pour ton frontend
                const fileUrl = `${process.env.SCALEWAY_ENDPOINT}/${process.env.SCALEWAY_BUCKET_NAME}/${fileName}`;


                res.status(200).json({
                    message: "Upload réussi sur Scaleway !",
                    url: fileUrl
                });
            } catch (error) {
                console.error("Erreur S3:", error);
                res.status(500).json({ message: "Erreur lors de l'envoi au stockage" });
            }
        });
        console.log(`✅ Connecté à la base de données ${process.env.DB_NAME}`);


        // UTILISATEURS (CRUD complet)
// GET ALL utilisateurs
        app.get('/api/utilisateurs', async (req, res) => {
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
        app.get('/api/utilisateurs/:id', async (req, res) => {
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
        // POST nouveau utilisateur
        app.post('/api/utilisateurs', async (req, res) => {
            try {
                const { nom, prenom, email, mot_de_passe, nom_role = 'PUBLIC', actif } = req.body;


                // 1. Vérification si mdp présent
                if (!mot_de_passe) return res.status(400).json({ error: "Mot de passe requis" });


                // 2. Hachage (nom de variable : mdpHash pour être sûr)
                const mdpHash = await bcrypt.hash(mot_de_passe, 10);


                // 3. Déterminer la valeur de actif (si le front envoie 0 ou 1)
                // Si 'actif' est undefined, on met 1 par défaut.
                const valeurActif = (actif === undefined || actif === 1 || actif === true) ? 1 : 0;


                const [result] = await db.execute(
                    `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, nom_role, date_inscription, actif)
                VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
                    [nom, prenom, email, mdpHash, nom_role, valeurActif] // ✅ Variables corrigées
                );


                res.status(201).json({
                    success: true,
                    id: result.insertId,
                    message: 'Utilisateur créé !'
                });
            } catch (err) {
                console.error("Erreur POST Utilisateur:", err); // 👈 Ajoute ça pour voir l'erreur dans ta console
                res.status(500).json({ error: err.message });
            }
        });
        ////////////////////// LOGIN/////////////////////






// PUT modifier utilisateur
        app.put('/api/utilisateurs/:id', async (req, res) => {
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


                // 🔑
                if (body.actif !== undefined) {
                    updates.push('actif = ?');
                    values.push(body.actif ? 1 : 0); // Force 1 ou 0
                }


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
        app.delete('/api/utilisateurs/:id', async (req, res) => {
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
        // ✅ GARDER UNIQUEMENT CETTE VERSION DU LOGIN
        app.post('/api/login', async (req, res) => {
            try {
                const { email, mot_de_passe } = req.body;


                const [users] = await db.execute(
                    'SELECT * FROM utilisateur WHERE email = ?',
                    [email]
                );


                if (users.length === 0) {
                    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
                }


                const user = users[0];
                // Comparaison du mot de passe saisi avec le hash en BDD
                const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);


                if (!valid) {
                    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
                }


                // Vérification si l'utilisateur est actif
                if (user.actif === 0) {
                    return res.status(403).json({ success: false, message: 'Compte désactivé' });
                }


                const { mot_de_passe: _, ...userData } = user;
                res.json({ success: true, user: userData });


            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
////============FILMS===========================================================/////////////////////////


        //GET FILM BY ID
        app.get('/api/films/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const [results] = await db.execute(`
               SELECT f.*, u.nom as realisateur_nom, u.prenom as realisateur_prenom
               FROM film f
                        LEFT JOIN utilisateur u ON f.id_realisateur = u.id_utilisateur
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
        app.post('/api/films', upload.single('fichier_video'), async (req, res) => {
            try {
                const { id_realisateur, titre, email, description, lien_youtube, duree_secondes, pays } = req.body;
                const videoPath = req.file ? req.file.path : null;


                // --- CORRECTION MAJEURE ICI ---
                // On n'utilise plus isNaN pour bloquer, on transforme en null si c'est invalide
                let realisateurId = null;
                if (id_realisateur && id_realisateur !== "undefined" && id_realisateur !== "null" && id_realisateur !== "") {
                    realisateurId = parseInt(id_realisateur);
                    // Si après tentative de conversion c'est toujours NaN, on force à null
                    if (isNaN(realisateurId)) realisateurId = null;
                }


                // Vérification des champs vraiment obligatoires pour ta table
                if (!titre || !email) {
                    return res.status(400).json({ error: "Le titre et l'email sont obligatoires pour soumettre." });
                }


                const query = `
           INSERT INTO film
           (id_realisateur, titre, email, description, lien_youtube, duree_secondes, pays, fichier_video, statut_moderation, date_soumission)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en attente', NOW())
       `;


                const [result] = await db.execute(query, [
                    realisateurId, // Sera soit un nombre (ex: 5), soit null
                    titre,
                    email,
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
        app.get('/api/films', async (req, res) => {
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
        app.patch('/api/films/:id', async (req, res) => {
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
        app.put('/api/films/:id', upload.single('fichier_video'), async (req, res) => {
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
        app.delete('/api/films/:id', async (req, res) => {
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
        // GET tous les votes OU votes d’un jury
        app.get('/api/votes', async (req, res) => {
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
                        f.fichier_video, -- <--- AJOUTE CETTE LIGNE ICI
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
        app.get('/api/votes/:id', async (req, res) => {
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
        app.post('/api/votes', async (req, res) => {
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
        app.put('/api/votes/:id', async (req, res) => {
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
        app.delete('/api/votes/:id', async (req, res) => {
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
        app.get('/api/admin/utilisateurs', async (req, res) => {
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


        app.post('/api/admin/utilisateurs', async (req, res) => {
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


        app.put('/api/admin/utilisateurs/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const { nom, prenom, email, nom_role, actif } = req.body;


                // On convertit explicitement le booléen en nombre (true -> 1, false -> 0)
                const valeurActif = actif === true || actif === 1 ? 1 : 0;


                const [result] = await db.execute(
                    `UPDATE utilisateur
            SET nom = ?, prenom = ?, email = ?, nom_role = ?, actif = ?
            WHERE id_utilisateur = ?`,
                    [nom, prenom, email, nom_role, valeurActif, id]
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
        app.delete('/api/admin/utilisateurs/:id', async (req, res) => {
            const { id } = req.params;
            try {
                // 1. On tente la suppression
                await db.execute('DELETE FROM utilisateur WHERE id_utilisateur = ?', [id]);


                res.json({ success: true, message: 'Utilisateur supprimé définitivement.' });
            } catch (err) {
                // 2. Si erreur de contrainte (code ER_ROW_IS_REFERENCED_2 ou 1451)
                if (err.errno === 1451) {
                    // On désactive l'utilisateur à la place
                    await db.execute('UPDATE utilisateur SET actif = 0 WHERE id_utilisateur = ?', [id]);


                    return res.status(200).json({
                        success: true,
                        message: 'Utilisateur lié à des films : il a été désactivé pour préserver les données.'
                    });
                }
                res.status(500).json({ error: err.message });
            }
        });


// ==========  ADMIN CRUD ÉVÉNEMENTS ==========
        app.get('/api/admin/evenements', async (req, res) => {
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


        app.post('/api/admin/evenements', async (req, res) => {
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
        app.get('/api/admin/stats', async (req, res) => {
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
        app.put('/api/films/:id/validation', async (req, res) => {
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
        app.put('/api/films/:id', async (req, res) => {
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
        app.get('/api/newsletter', async (req, res) => {
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
        app.get('/api/newsletter/:id', async (req, res) => {
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
        app.post('/api/newsletter', async (req, res) => {
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
        app.post('/api/newsletter', async (req, res) => {
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
        app.put('/api/newsletter/:id', async (req, res) => {
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
        app.delete('/api/newsletter/:id', async (req, res) => {
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
        app.get('/api/notifications', async (req, res) => {
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
        app.get('/api/notifications/:id', async (req, res) => {
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
        app.post('/api/notifications', async (req, res) => {
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
        app.put('/api/notifications/:id', async (req, res) => {
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
        app.delete('/api/notifications/:id', async (req, res) => {
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
        app.get('/api/outils-ia', async (req, res) => {
            try {
                const [rows] = await db.execute('SELECT * FROM outil_ia ORDER BY nom_outil ASC');
                res.json(rows);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });


// GET un outil_ia
        app.get('/api/outils-ia/:id', async (req, res) => {
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
        app.post('/api/outils-ia', async (req, res) => {
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
        app.put('/api/outils-ia/:id', async (req, res) => {
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
        app.delete('/api/outils-ia/:id', async (req, res) => {
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
        app.get('/api/films/:id/outils-ia', async (req, res) => {
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
        app.post('/api/films/:id/outils-ia', async (req, res) => {
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
        app.delete('/api/films/:id/outils-ia/:id_outil', async (req, res) => {
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
        app.get('/api/biographie/:id', async (req, res) => {
            try {
                const [rows] = await db.execute('SELECT * FROM biographie WHERE id_utilisateur = ?', [req.params.id]);
                res.json(rows[0] || {});
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });


// Route pour sauvegarder/modifier la bio (avec Multer pour la photo)
// Sauvegarder ou Modifier la biographie
        app.post('/api/biographie', upload.single('photo_profil'), async (req, res) => {
            try {
                const { id_utilisateur, nom, prenom, biographie, site_officiel, pays_origine, instagram, youtube, twitter } = req.body;


                // On récupère le chemin de la photo si uploadée, sinon on garde l'ancienne URL
                const photoPath = req.file ? req.file.path : req.body.photo_url;


                // 1. Mise à jour du Nom et Prénom dans la table utilisateur
                await db.execute(
                    'UPDATE utilisateur SET nom = ?, prenom = ? WHERE id_utilisateur = ?',
                    [nom, prenom, id_utilisateur]
                );


                // 2. Vérifier si la biographie existe déjà pour cet utilisateur
                const [exists] = await db.execute('SELECT id_biographie FROM biographie WHERE id_utilisateur = ?', [id_utilisateur]);


                if (exists.length > 0) {
                    // UPDATE : On met à jour la bio existante
                    const queryUpdate = `
               UPDATE biographie
               SET texte_biographie = ?, site_officiel = ?, pays_origine = ?, instagram = ?, youtube = ?, twitter = ?, photo_profil = ?
               WHERE id_utilisateur = ?`;
                    await db.execute(queryUpdate, [biographie, site_officiel, pays_origine, instagram, youtube, twitter, photoPath, id_utilisateur]);
                } else {
                    // INSERT : On crée une nouvelle entrée
                    const queryInsert = `
               INSERT INTO biographie (id_utilisateur, texte_biographie, site_officiel, pays_origine, instagram, youtube, twitter, photo_profil)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                    await db.execute(queryInsert, [id_utilisateur, biographie, site_officiel, pays_origine, instagram, youtube, twitter, photoPath]);
                }


                res.json({ success: true, message: "Profil synchronisé avec succès" });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: err.message });
            }
        });
// POST créer biographie
        app.post('/api/utilisateurs/:id/biographie', async (req, res) => {
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
        app.put('/api/utilisateurs/:id/biographie', async (req, res) => {
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
        app.delete('/api/utilisateurs/:id/biographie', async (req, res) => {
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
        // verifier avec notre API youtube


        app.post('/api/admin/verifier-film', async (req, res) => {
            const { videoUrl, id_film } = req.body;


            try {
                // 1. Appel à l'API de modération
                const response = await axios.get('https://api.sightengine.com/1.0/video/check.json', {
                    params: {
                        'stream_url': 'https://www.youtube.com/channel/UCUuTLakAZ_ScleXu9bkCO3Q',
                        'models': 'nudity,wad,offensive', // wad = weapons, alcohol, drugs
                        'api_user': 'UuTLakAZ_ScleXu9bkCO3Q',
                        'api_secret': 'UCUuTLakAZ_ScleXu9bkCO3Q'
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
        // GET les gagnants du palmarès
// Route pour récupérer les gagnants du palmarès
        app.get('/api/palmares', async (req, res) => {
            try {
                const [results] = await db.execute(
                    `SELECT
               id_film,
               titre,
                id_realisateur,
               pays,
               fichier_video,
               prix_remporte,
               description
            FROM film
            WHERE prix_remporte IS NOT NULL AND prix_remporte != ''`
                );
                res.json(results);
            } catch (err) {
                console.error("Erreur SQL:", err);
                res.status(500).json({ error: err.message });
            }
        });
        // Route de test pour vérifier la connexion
        app.get('/api/health', (req, res) => {
            res.json({ status: "OK", database: process.env.DB_NAME });
        });


        // Lancement du serveur à l'intérieur ou après initApp
        const PORT = process.env.PORT || 8081;
        app.listen(PORT, () => {
            console.log(`🚀 SERVEUR MARSIA SUR LE PORT ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Erreur d'initialisation:", err);
    }
}
// Fin de la fonction initApp


// APPEL DE LA FONCTION POUR DÉMARRER LE TOUT
initApp().catch(err => {
    console.error("❌ ERREUR DE DÉMARRAGE :", err.message);
});
