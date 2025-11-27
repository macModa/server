// ============================================
// BACKEND - Node.js + Express + MongoDB
// Habits Tracker API - Prêt pour Render
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// Logs des requêtes (dev)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// ============ CONNEXION MONGODB ============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/habits';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connecté'))
    .catch(err => {
        console.error('❌ Erreur MongoDB:', err);
        process.exit(1);
    });

// ============ MODÈLE HABIT ============
const habitSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'userId est requis'],
        index: true
    },
    name: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true,
        minlength: [1, 'Le nom doit contenir au moins 1 caractère'],
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

const Habit = mongoose.model('Habit', habitSchema);

// ============ VALIDATION MIDDLEWARE ============
const validateHabit = (req, res, next) => {
    const { userId, name } = req.body;

    const errors = [];

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        errors.push('userId est requis et doit être une chaîne non vide');
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.push('name est requis et doit être une chaîne non vide');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    next();
};

// ============ ROUTES CRUD ============

// 🏠 Route de test
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Habits Tracker API',
        version: '1.0.0',
        endpoints: {
            create: 'POST /habits',
            getByUser: 'GET /habits/:userId',
            update: 'PUT /habits/:id',
            delete: 'DELETE /habits/:id'
        }
    });
});

// ✅ CREATE - Créer une habitude
app.post('/habits', validateHabit, async (req, res) => {
    try {
        const { userId, name } = req.body;

        const habit = new Habit({
            userId: userId.trim(),
            name: name.trim()
        });

        await habit.save();

        console.log(`✅ Habit créé: ${habit.name} (user: ${habit.userId})`);

        res.status(201).json({
            success: true,
            message: 'Habitude créée avec succès',
            data: habit.toJSON()
        });
    } catch (error) {
        console.error('❌ Erreur création:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création de l\'habitude',
            message: error.message
        });
    }
});

// 📋 READ - Obtenir toutes les habitudes d'un utilisateur
app.get('/habits/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || userId.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'userId est requis'
            });
        }

        const habits = await Habit.find({ userId: userId.trim() })
            .sort({ createdAt: -1 });

        console.log(`📋 ${habits.length} habitudes trouvées pour user: ${userId}`);

        res.json({
            success: true,
            count: habits.length,
            data: habits.map(h => h.toJSON())
        });
    } catch (error) {
        console.error('❌ Erreur lecture:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des habitudes',
            message: error.message
        });
    }
});

// ✏️ UPDATE - Modifier une habitude
app.put('/habits/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'name est requis et doit être une chaîne non vide'
            });
        }

        const habit = await Habit.findByIdAndUpdate(
            id,
            { name: name.trim() },
            { new: true, runValidators: true }
        );

        if (!habit) {
            return res.status(404).json({
                success: false,
                error: 'Habitude non trouvée'
            });
        }

        console.log(`✏️ Habit modifiée: ${habit.name}`);

        res.json({
            success: true,
            message: 'Habitude modifiée avec succès',
            data: habit.toJSON()
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la modification de l\'habitude',
            message: error.message
        });
    }
});

// 🗑️ DELETE - Supprimer une habitude
app.delete('/habits/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const habit = await Habit.findByIdAndDelete(id);

        if (!habit) {
            return res.status(404).json({
                success: false,
                error: 'Habitude non trouvée'
            });
        }

        console.log(`🗑️ Habit supprimée: ${habit.name}`);

        res.json({
            success: true,
            message: 'Habitude supprimée avec succès',
            data: habit.toJSON()
        });
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de l\'habitude',
            message: error.message
        });
    }
});

// ============ GESTION D'ERREURS ============

// 404 - Route non trouvée
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route non trouvée',
        path: req.path
    });
});

// Erreur globale
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err);
    res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        message: err.message
    });
});

// ============ DÉMARRAGE SERVEUR ============
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════╗
║   🚀 Habits Tracker API            ║
║   Port: ${PORT.toString().padEnd(27)}║
║   MongoDB: ${mongoose.connection.readyState === 1 ? 'Connecté ✅' : 'En attente...'}        ║
╚════════════════════════════════════╝
  `);
});

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
    console.log('👋 Arrêt du serveur...');
    mongoose.connection.close(() => {
        process.exit(0);
    });
});
