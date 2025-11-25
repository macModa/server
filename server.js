// server.js - Backend Node.js OPTIMISÉ pour Habit Coach Flutter App
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============

// Sécurité
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: '*', // En production, spécifier les domaines autorisés
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limite par IP
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ CONNEXION MONGODB ============

const mongoUri = process.env.MONGODB_URI || '';
if (mongoUri && (mongoUri.includes('mongodb'))) {
    mongoose.connect(mongoUri)
        .then(() => console.log('✅ Connecté à MongoDB Atlas'))
        .catch(err => console.error('❌ Erreur MongoDB:', err));
} else {
    console.warn('⚠️  Aucune URI MongoDB valide. Configurez MONGODB_URI dans .env');
}

// ============ SCHÉMAS MONGODB ============

// Schéma Utilisateur
const userSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    motDePasse: { type: String, required: true },
    points: { type: Number, default: 0 },
    niveau: { type: Number, default: 1 },
    badges: [String],
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: {
        transform: (doc, ret) => {
            ret._id = ret._id.toString();
            delete ret.motDePasse; // Ne jamais retourner le mot de passe
            delete ret.__v;
            return ret;
        }
    }
});

// ⭐ Schéma Habitude - ALIGNÉ avec Flutter App (MONGODB_FORMAT.md)
const habitudeSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // String pour compatibilité Flutter
    nom: { type: String, required: true },
    icone: { type: String, default: '⭐' },
    couleur: { type: String, default: '#6366f1' },
    objectifQuotidien: { type: Number, default: 1 },
    unite: { type: String, default: 'fois' },
    rappel: { type: Boolean, default: true },
    heureRappel: { type: String, default: '09:00' },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: {
        transform: (doc, ret) => {
            // Renommer _id et formater pour Flutter
            ret._id = ret._id.toString();
            ret.userId = ret.userId.toString();
            ret.createdAt = ret.createdAt.toISOString();
            delete ret.__v;
            return ret;
        }
    }
});

// Schéma Progression
const progressionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    habitudeId: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    valeur: { type: Number, default: 0 },
    complete: { type: Boolean, default: false },
    pointsGagnes: { type: Number, default: 0 }
}, {
    toJSON: {
        transform: (doc, ret) => {
            ret._id = ret._id.toString();
            delete ret.__v;
            return ret;
        }
    }
});

const User = mongoose.model('User', userSchema);
const Habitude = mongoose.model('Habitude', habitudeSchema);
const Progression = mongoose.model('Progression', progressionSchema);

// ============ ROUTES UTILISATEURS ============

// Inscription
app.post('/api/auth/inscription', async (req, res) => {
    try {
        const { nom, email, motDePasse } = req.body;

        if (!nom || !email || !motDePasse) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        const existant = await User.findOne({ email });
        if (existant) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        const motDePasseHash = await bcrypt.hash(motDePasse, 10);

        const user = new User({
            nom,
            email,
            motDePasse: motDePasseHash
        });

        await user.save();

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: {
                _id: user._id.toString(),
                nom: user.nom,
                email: user.email,
                points: user.points,
                niveau: user.niveau,
                badges: user.badges,
                createdAt: user.createdAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Connexion
app.post('/api/auth/connexion', async (req, res) => {
    try {
        const { email, motDePasse } = req.body;

        if (!email || !motDePasse) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const valide = await bcrypt.compare(motDePasse, user.motDePasse);
        if (!valide) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        res.json({
            message: 'Connexion réussie',
            user: {
                _id: user._id.toString(),
                nom: user.nom,
                email: user.email,
                points: user.points,
                niveau: user.niveau,
                badges: user.badges,
                createdAt: user.createdAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtenir profil utilisateur
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-motDePasse');
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (error) {
        console.error('Erreur get user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour points et niveau
app.put('/api/users/:id/points', async (req, res) => {
    try {
        const { points } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        user.points += points;
        user.niveau = Math.floor(user.points / 100) + 1;

        // Attribution badges
        if (user.points >= 100 && !user.badges.includes('🏆 Première Centaine')) {
            user.badges.push('🏆 Première Centaine');
        }
        if (user.points >= 500 && !user.badges.includes('🌟 Champion')) {
            user.badges.push('🌟 Champion');
        }
        if (user.points >= 1000 && !user.badges.includes('👑 Légende')) {
            user.badges.push('👑 Légende');
        }

        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Erreur update points:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ ROUTES HABITUDES ============

// ⭐ Créer une habitude (Compatible Flutter format)
app.post('/api/habitudes', async (req, res) => {
    try {
        console.log('📥 Creating habit:', req.body);

        const { userId, nom, icone, couleur, objectifQuotidien, unite, rappel, heureRappel } = req.body;

        if (!userId || !nom) {
            return res.status(400).json({ error: 'userId et nom sont requis' });
        }

        const habitude = new Habitude({
            userId,
            nom,
            icone: icone || '⭐',
            couleur: couleur || '#6366f1',
            objectifQuotidien: objectifQuotidien || 1,
            unite: unite || 'fois',
            rappel: rappel !== undefined ? rappel : true,
            heureRappel: heureRappel || '09:00'
        });

        await habitude.save();

        console.log('✅ Habit created:', habitude.toJSON());
        res.status(201).json(habitude.toJSON());
    } catch (error) {
        console.error('❌ Erreur création habitude:', error);
        res.status(500).json({ error: error.message });
    }
});

// ⭐ Obtenir toutes les habitudes d'un utilisateur
app.get('/api/habitudes/user/:userId', async (req, res) => {
    try {
        console.log('📥 Fetching habits for user:', req.params.userId);

        const habitudes = await Habitude.find({ userId: req.params.userId });

        const habituresJSON = habitudes.map(h => h.toJSON());
        console.log(`✅ Found ${habituresJSON.length} habits`);

        res.json(habituresJSON);
    } catch (error) {
        console.error('❌ Erreur get habitudes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Modifier une habitude
app.put('/api/habitudes/:id', async (req, res) => {
    try {
        const habitude = await Habitude.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!habitude) {
            return res.status(404).json({ error: 'Habitude non trouvée' });
        }
        res.json(habitude.toJSON());
    } catch (error) {
        console.error('Erreur update habitude:', error);
        res.status(500).json({ error: error.message });
    }
});

// ⭐ Supprimer une habitude
app.delete('/api/habitudes/:id', async (req, res) => {
    try {
        console.log('🗑️ Deleting habit:', req.params.id);

        const habitude = await Habitude.findByIdAndDelete(req.params.id);
        if (!habitude) {
            return res.status(404).json({ error: 'Habitude non trouvée' });
        }

        // Supprimer aussi toutes les progressions liées
        await Progression.deleteMany({ habitudeId: req.params.id });

        console.log('✅ Habit deleted');
        res.json({ message: 'Habitude supprimée avec succès', _id: req.params.id });
    } catch (error) {
        console.error('❌ Erreur delete habitude:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ ROUTES PROGRESSION ============

// Enregistrer une progression
app.post('/api/progressions', async (req, res) => {
    try {
        const { userId, habitudeId, date, valeur } = req.body;

        if (!userId || !habitudeId || !date) {
            return res.status(400).json({ error: 'userId, habitudeId et date sont requis' });
        }

        let progression = await Progression.findOne({ userId, habitudeId, date });

        const habitude = await Habitude.findById(habitudeId);
        if (!habitude) {
            return res.status(404).json({ error: 'Habitude non trouvée' });
        }

        const complete = valeur >= habitude.objectifQuotidien;
        const pointsGagnes = complete ? 10 : Math.floor((valeur / habitude.objectifQuotidien) * 10);

        if (progression) {
            progression.valeur = valeur;
            progression.complete = complete;
            progression.pointsGagnes = pointsGagnes;
            await progression.save();
        } else {
            progression = new Progression({
                userId,
                habitudeId,
                date,
                valeur,
                complete,
                pointsGagnes
            });
            await progression.save();
        }

        res.status(201).json(progression.toJSON());
    } catch (error) {
        console.error('Erreur progression:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtenir progressions d'un utilisateur pour une date
app.get('/api/progressions/user/:userId/date/:date', async (req, res) => {
    try {
        const progressions = await Progression.find({
            userId: req.params.userId,
            date: req.params.date
        });
        res.json(progressions.map(p => p.toJSON()));
    } catch (error) {
        console.error('Erreur get progressions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtenir historique d'une habitude
app.get('/api/progressions/habitude/:habitudeId', async (req, res) => {
    try {
        const progressions = await Progression.find({
            habitudeId: req.params.habitudeId
        }).sort({ date: -1 }).limit(30);
        res.json(progressions.map(p => p.toJSON()));
    } catch (error) {
        console.error('Erreur get historique:', error);
        res.status(500).json({ error: error.message });
    }
});

// Statistiques hebdomadaires
app.get('/api/progressions/user/:userId/semaine', async (req, res) => {
    try {
        const maintenant = new Date();
        const ilYa7Jours = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);

        const dateDebut = ilYa7Jours.toISOString().split('T')[0];
        const dateFin = maintenant.toISOString().split('T')[0];

        const progressions = await Progression.find({
            userId: req.params.userId,
            date: { $gte: dateDebut, $lte: dateFin }
        });

        const stats = {
            totalPoints: progressions.reduce((sum, p) => sum + p.pointsGagnes, 0),
            objectifsReussis: progressions.filter(p => p.complete).length,
            totalObjectifs: progressions.length,
            tauxReussite: progressions.length > 0
                ? Math.round((progressions.filter(p => p.complete).length / progressions.length) * 100)
                : 0
        };

        res.json(stats);
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ ROUTE DE TEST ============

app.get('/', (req, res) => {
    res.json({
        message: '🚀 API Habit Coach en ligne!',
        version: '1.0.0',
        mongodb: mongoose.connection.readyState === 1 ? '✅ Connecté' : '❌ Déconnecté',
        endpoints: {
            auth: {
                inscription: 'POST /api/auth/inscription',
                connexion: 'POST /api/auth/connexion'
            },
            users: {
                get: 'GET /api/users/:id',
                updatePoints: 'PUT /api/users/:id/points'
            },
            habitudes: {
                create: 'POST /api/habitudes',
                getByUser: 'GET /api/habitudes/user/:userId',
                update: 'PUT /api/habitudes/:id',
                delete: 'DELETE /api/habitudes/:id'
            },
            progressions: {
                create: 'POST /api/progressions',
                getByDate: 'GET /api/progressions/user/:userId/date/:date',
                getHistory: 'GET /api/progressions/habitude/:habitudeId',
                getWeekStats: 'GET /api/progressions/user/:userId/semaine'
            }
        }
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🎯 Habit Coach API Server          ║
║   Port: ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}             ║
╚═══════════════════════════════════════╝
  `);
    console.log('📚 Documentation: http://localhost:' + PORT);
    console.log('🔗 MongoDB:', mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️  Waiting...');
});

module.exports = app;
