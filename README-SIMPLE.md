# 🎯 Habits Tracker - Système Complet

Système complet de suivi d'habitudes avec backend Node.js et frontend Flutter.

## 📦 Architecture

```
Backend (Node.js)          Flutter App
     ↓                          ↓
server-simple.js          models/habit.dart
     ↓                    services/habit_service_simple.dart
  MongoDB               screens/habit_screen_simple.dart
```

---

## 🚀 Backend - Installation

### 1. Dépendances

Dans `.backend/package.json`, vous avez déjà:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

### 2. Variables d'environnement

Créer `.backend/.env`:
```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/habits?retryWrites=true&w=majority
```

### 3. Démarrer le serveur

```bash
cd .backend
npm install
node server-simple.js
```

**Serveur accessible à:** `http://localhost:3000`

---

## 📡 API Endpoints

### Test
```http
GET /
```
**Réponse:**
```json
{
  "success": true,
  "message": "🚀 Habits Tracker API",
  "endpoints": { ... }
}
```

### Créer une habitude
```http
POST /habits
Content-Type: application/json

{
  "userId": "user123",
  "name": "Méditation"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Habitude créée avec succès",
  "data": {
    "id": "507f191e810c19729de860ea",
    "userId": "user123",
    "name": "Méditation",
    "createdAt": "2025-11-25T14:00:00.000Z"
  }
}
```

### Obtenir toutes les habitudes
```http
GET /habits/:userId
```

**Réponse:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "...",
      "userId": "user123",
      "name": "Méditation",
      "createdAt": "2025-11-25T14:00:00.000Z"
    },
    ...
  ]
}
```

### Modifier une habitude
```http
PUT /habits/:id
Content-Type: application/json

{
  "name": "Méditation matinale"
}
```

### Supprimer une habitude
```http
DELETE /habits/:id
```

---

## 📱 Flutter - Configuration

### 1. Ajouter la dépendance

Dans `pubspec.yaml`:
```yaml
dependencies:
  http: ^1.1.2
```

Puis:
```bash
flutter pub get
```

### 2. Structure des fichiers

```
lib/
├── models/
│   └── habit.dart
├── services/
│   └── habit_service_simple.dart
└── screens/
    └── habit_screen_simple.dart
```

### 3. Utiliser l'écran

Dans votre `main.dart` ou n'importe où:

```dart
import 'package:flutter/material.dart';
import 'screens/habit_screen_simple.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Habits Tracker',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const HabitScreen(
        userId: 'user123', // Remplacer par l'ID de l'utilisateur connecté
      ),
    );
  }
}
```

---

## 🧪 Tester l'Application

### Test Backend avec curl

```bash
# Créer une habitude
curl -X POST http://localhost:3000/habits \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","name":"Méditation"}'

# Obtenir les habitudes
curl http://localhost:3000/habits/user123

# Modifier une habitude
curl -X PUT http://localhost:3000/habits/HABIT_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Méditation matinale"}'

# Supprimer une habitude
curl -X DELETE http://localhost:3000/habits/HABIT_ID
```

### Test Flutter

1. Lancer le backend
2. Lancer l'app Flutter:
```bash
flutter run
```

3. Dans l'app:
   - ✅ Ajouter une habitude
   - 📋 Voir la liste
   - ✏️ Modifier une habitude
   - 🗑️ Supprimer une habitude

---

## 🌐 Déployer sur Render

### 1. Préparer le backend

Le fichier `server-simple.js` est prêt pour Render!

### 2. Configuration Render

1. Aller sur [render.com](https://render.com)
2. Créer un nouveau Web Service
3. Connecter votre repo Git
4. Configurer:
   - **Build Command:** `npm install`
   - **Start Command:** `node server-simple.js`
   - **Environment Variables:**
     - `MONGODB_URI`: Votre URI MongoDB Atlas

### 3. Mettre à jour Flutter

Dans `habit_service_simple.dart`, changer:

```dart
static const String baseUrl = 'https://VOTRE-APP.onrender.com';
```

---

## 🔐 Validation et Sécurité

Le backend inclut:
- ✅ Validation des champs requis
- ✅ Trim des espaces
- ✅ Validation de longueur
- ✅ Gestion d'erreurs complète
- ✅ CORS activé
- ✅ Logs détaillés

---

## 📊 Modèle de Données

### MongoDB Schema
```javascript
{
  userId: String (requis, indexé),
  name: String (requis, trim, 1-100 chars),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Flutter Model
```dart
class Habit {
  final String id;
  final String userId;
  final String name;
  final DateTime createdAt;
}
```

---

## 🎨 Fonctionnalités Flutter

L'écran `HabitScreen` offre:
- ✅ Ajout d'habitude (TextField + Bouton)
- 📋 Liste scrollable des habitudes
- ✏️ Modification avec dialog
- 🗑️ Suppression avec confirmation
- 🔄 Rafraîchissement manuel
- ⏳ États de chargement
- ❌ Gestion d'erreurs
- 📱 UI Material Design 3

---

## 🚀 Démarrage Rapide

### Backend
```bash
cd .backend
npm install
node server-simple.js
```

### Frontend
```bash
flutter pub get
flutter run
```

---

## 📝 Notes Importantes

1. **userId**: Dans une vraie app, utilisez l'ID de l'utilisateur connecté (Firebase Auth, etc.)

2. **URL Backend**: 
   - Local: `http://localhost:3000`
   - Production: `https://server-6tf0.onrender.com`

3. **CORS**: Le backend accepte toutes les origines en dev. En production, restreindre à votre domaine.

4. **Erreurs**: Tous les logs sont dans la console (backend: terminal, frontend: debug console).

---

## 🎉 Résumé

✔ Backend Node.js complet avec CRUD
✔ MongoDB avec Mongoose
✔ Flutter service + UI complets
✔ Validation et gestion d'erreurs
✔ Prêt pour Render.com
✔ Code commenté et optimisé

Votre système est prêt à l'emploi! 🚀
