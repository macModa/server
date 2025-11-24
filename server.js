// server.js - Backend Node.js pour l'application de suivi d'habitudes
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB Atlas (si `MONGODB_URI` est configuré)
const mongoUriRaw = process.env.MONGODB_URI || '';
const mongoUri = typeof mongoUriRaw === 'string' ? mongoUriRaw.trim() : '';
const mongoUriLower = mongoUri.toLowerCase();
if (mongoUri && (mongoUriLower.startsWith('mongodb://') || mongoUriLower.startsWith('mongodb+srv://') || mongoUriLower.includes('mongodb'))) {
  mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connecté à MongoDB Atlas'))
    .catch(err => console.error('❌ Erreur MongoDB:', err));
} else {
  console.warn('⚠️  Aucune URI MongoDB valide fournie. Connexion MongoDB ignorée.');
}

// Schéma Utilisateur
const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  points: { type: Number, default: 0 },
  niveau: { type: Number, default: 1 },
  badges: [String],
  dateCreation: { type: Date, default: Date.now }
});

// Schéma Habitude
const habitudeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nom: { type: String, required: true },
  icone: { type: String, default: '⭐' },
  couleur: { type: String, default: '#6366f1' },
  objectifQuotidien: { type: Number, default: 1 },
  unite: { type: String, default: 'fois' },
  rappel: { type: Boolean, default: true },
  heureRappel: { type: String, default: '09:00' },
  dateCreation: { type: Date, default: Date.now }
});

// Schéma Progression
const progressionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habitudeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habitude', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  valeur: { type: Number, default: 0 },
  complete: { type: Boolean, default: false },
  pointsGagnes: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);
const Habitude = mongoose.model('Habitude', habitudeSchema);
const Progression = mongoose.model('Progression', progressionSchema);

// ============ ROUTES UTILISATEURS ============

// Inscription
app.post('/api/auth/inscription', async (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;
    
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
      user: { id: user._id, nom: user.nom, email: user.email, points: user.points, niveau: user.niveau }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connexion
app.post('/api/auth/connexion', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
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
        id: user._id, 
        nom: user.nom, 
        email: user.email, 
        points: user.points, 
        niveau: user.niveau,
        badges: user.badges 
      }
    });
  } catch (error) {
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
    // Calcul niveau: tous les 100 points = 1 niveau
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
    res.status(500).json({ error: error.message });
  }
});

// ============ ROUTES HABITUDES ============

// Créer une habitude
app.post('/api/habitudes', async (req, res) => {
  try {
    const habitude = new Habitude(req.body);
    await habitude.save();
    res.status(201).json(habitude);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir toutes les habitudes d'un utilisateur
app.get('/api/habitudes/user/:userId', async (req, res) => {
  try {
    const habitudes = await Habitude.find({ userId: req.params.userId });
    res.json(habitudes);
  } catch (error) {
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
    res.json(habitude);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une habitude
app.delete('/api/habitudes/:id', async (req, res) => {
  try {
    const habitude = await Habitude.findByIdAndDelete(req.params.id);
    if (!habitude) {
      return res.status(404).json({ error: 'Habitude non trouvée' });
    }
    // Supprimer aussi toutes les progressions liées
    await Progression.deleteMany({ habitudeId: req.params.id });
    res.json({ message: 'Habitude supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ROUTES PROGRESSION ============

// Enregistrer une progression
app.post('/api/progressions', async (req, res) => {
  try {
    const { userId, habitudeId, date, valeur } = req.body;
    
    // Vérifier si progression existe déjà pour cette date
    let progression = await Progression.findOne({ userId, habitudeId, date });
    
    const habitude = await Habitude.findById(habitudeId);
    if (!habitude) {
      return res.status(404).json({ error: 'Habitude non trouvée' });
    }

    const complete = valeur >= habitude.objectifQuotidien;
    const pointsGagnes = complete ? 10 : Math.floor((valeur / habitude.objectifQuotidien) * 10);

    if (progression) {
      // Mettre à jour
      progression.valeur = valeur;
      progression.complete = complete;
      progression.pointsGagnes = pointsGagnes;
      await progression.save();
    } else {
      // Créer nouvelle
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

    res.status(201).json(progression);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir progressions d'un utilisateur pour une date
app.get('/api/progressions/user/:userId/date/:date', async (req, res) => {
  try {
    const progressions = await Progression.find({
      userId: req.params.userId,
      date: req.params.date
    }).populate('habitudeId');
    res.json(progressions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir historique d'une habitude
app.get('/api/progressions/habitude/:habitudeId', async (req, res) => {
  try {
    const progressions = await Progression.find({
      habitudeId: req.params.habitudeId
    }).sort({ date: -1 }).limit(30);
    res.json(progressions);
  } catch (error) {
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
    }).populate('habitudeId');

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
    res.status(500).json({ error: error.message });
  }
});

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Habit Tracker en ligne!',
    endpoints: {
      auth: '/api/auth/inscription, /api/auth/connexion',
      users: '/api/users/:id',
      habitudes: '/api/habitudes',
      progressions: '/api/progressions'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🎯 Serveur démarré sur le port ${PORT}`);
});