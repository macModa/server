# Guide de Déploiement - Habit Tracker Backend

Ce guide vous accompagne pas à pas pour déployer votre backend sur Render.com.

## 📋 Prérequis

- [ ] Compte GitHub
- [ ] Compte Render.com (gratuit)
- [ ] Compte MongoDB Atlas (gratuit)
- [ ] Clé de service Firebase Admin

---

## Étape 1: Préparer MongoDB Atlas (Base de données)

### 1.1 Créer un compte MongoDB Atlas

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Créez un compte gratuit
3. Créez un nouveau cluster (choisissez FREE tier)

### 1.2 Configurer l'accès

1. Dans **Database Access**, créez un utilisateur:
   - Username: `habitadmin`
   - Password: Générez un mot de passe fort (notez-le!)
   - Database User Privileges: `Atlas admin`

2. Dans **Network Access**, ajoutez l'accès:
   - Cliquez **Add IP Address**
   - Choisissez **Allow Access from Anywhere** (0.0.0.0/0)
   - Confirmez

### 1.3 Obtenir l'URI de connexion

1. Cliquez sur **Connect** sur votre cluster
2. Choisissez **Connect your application**
3. Driver: `Node.js`, Version: `5.5 or later`
4. Copiez l'URI de connexion:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Remplacez `<username>` et `<password>` par vos identifiants

**Exemple final:**
```
mongodb+srv://habitadmin:VotreMotDePasse123@cluster0.abc123.mongodb.net/habits?retryWrites=true&w=majority
```

> ⚠️ **Important**: Ajoutez `/habits` après `.mongodb.net` pour nommer votre base de données

---

## Étape 2: Obtenir la Clé Firebase Admin

### 2.1 Télécharger la clé de service

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur ⚙️ > **Project settings**
4. Onglet **Service accounts**
5. Cliquez **Generate new private key**
6. Confirmez le téléchargement

### 2.2 Préparer la clé pour Render

Le fichier JSON téléchargé ressemble à:
```json
{
  "type": "service_account",
  "project_id": "votre-projet",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  ...
}
```

**IMPORTANT**: Vous devez le minifier (supprimer les retours à la ligne):

**Option 1**: Utilisez un outil en ligne
- [JSON Minifier](https://jsonformatter.org/json-minify)
- Collez votre JSON
- Cliquez "Minify"
- Copiez le résultat

**Option 2**: Manuellement avec un éditeur de texte
- Supprimez tous les retours à la ligne
- Assurez-vous que `\n` dans `private_key` devient `\\n`

**Résultat attendu** (une seule ligne):
```json
{"type":"service_account","project_id":"votre-projet","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xxxxx@votre-projet.iam.gserviceaccount.com",...}
```

---

## Étape 3: Préparer le Code pour Render

### 3.1 Vérifier package.json

Assurez-vous que `package.json` contient:

```json
{
  "name": "habit-tracker-backend",
  "version": "2.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3.2 Créer .gitignore

Créez `.backend/.gitignore`:
```
node_modules/
.env
*.log
```

### 3.3 Push sur GitHub

```bash
cd c:\Users\dell\Desktop\push\node-red\habit\habitcoach

# Si pas encore initialisé
git init

# Ajouter les fichiers
git add .
git commit -m "Add secure backend with Firebase auth"

# Push vers GitHub
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/habit-tracker.git
git push -u origin main
```

---

## Étape 4: Déployer sur Render.com

### 4.1 Créer un nouveau Web Service

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez **New +** > **Web Service**
3. Connectez votre repository GitHub
4. Sélectionnez le repository `habit-tracker`

### 4.2 Configurer le service

**Configuration de base:**
- **Name**: `habit-tracker-api` (ou votre choix)
- **Root Directory**: `.backend`
- **Environment**: `Node`
- **Region**: Choisissez le plus proche (Europe - Frankfurt)
- **Branch**: `main`

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan:**
- Choisissez **Free** (suffisant pour commencer)

### 4.3 Ajouter les variables d'environnement

Cliquez sur **Advanced** puis ajoutez ces variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Environment |
| `MONGODB_URI` | `mongodb+srv://...` | Votre URI MongoDB Atlas complet |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `{"type":"service_account",...}` | JSON minifié (UNE SEULE LIGNE) |
| `CORS_ORIGIN` | `*` | Pour le moment, ou votre URL Flutter |

**Exemple de FIREBASE_SERVICE_ACCOUNT_KEY:**
```
{"type":"service_account","project_id":"habitcoach-abc","private_key_id":"123abc","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvQIB...\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xyz@habitcoach.iam.gserviceaccount.com","client_id":"123456","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
```

> ⚠️ **CRITIQUE**: Le JSON doit être sur UNE SEULE ligne, sans retours à la ligne!

### 4.4 Déployer

1. Cliquez **Create Web Service**
2. Render va automatiquement:
   - Cloner votre repo
   - Installer les dépendances
   - Démarrer le serveur

**Attendez 2-5 minutes** pour le premier déploiement.

---

## Étape 5: Vérifier le Déploiement

### 5.1 Vérifier les logs

Dans le dashboard Render:
1. Cliquez sur votre service
2. Onglet **Logs**
3. Vous devriez voir:
   ```
   ✅ Firebase Admin SDK initialized successfully
   ✅ MongoDB connected successfully
   🚀 Habit Tracker API - Secure Edition
   ```

### 5.2 Erreurs courantes et solutions

**Erreur**: `Could not load Firebase credentials`
- **Solution**: Vérifiez que `FIREBASE_SERVICE_ACCOUNT_KEY` est bien minifié (une seule ligne)
- Vérifiez les caractères d'échappement `\\n` dans `private_key`

**Erreur**: `MongoDB connection failed`
- **Solution**: Vérifiez l'URI MongoDB
- Assurez-vous que `/habits` est bien dans l'URI
- Vérifiez que l'IP 0.0.0.0/0 est autorisée dans MongoDB Atlas

**Erreur**: `Module not found`
- **Solution**: Vérifiez que `Root Directory` est bien `.backend`

### 5.3 Tester l'API

Votre URL Render sera: `https://habit-tracker-api.onrender.com`

**Test 1: Health Check (devrait fonctionner sans token)**
```bash
curl https://habit-tracker-api.onrender.com/
```

Réponse attendue:
```json
{
  "success": true,
  "message": "🚀 Habit Tracker API - Secure Edition",
  "version": "2.0.0"
}
```

**Test 2: API Status**
```bash
curl https://habit-tracker-api.onrender.com/api/status
```

---

## Étape 6: Mettre à Jour Flutter

### 6.1 Modifier l'URL du backend

Éditez `lib/services/api_service.dart`:

```dart
class ApiService {
  // Remplacez par votre URL Render
  static const String baseUrl = 'https://habit-tracker-api.onrender.com';
  
  // ... reste du code
}
```

### 6.2 Tester l'application

```bash
# Hot reload
r

# Ou redémarrer
flutter run -d edge
```

**Test complet:**
1. ✅ Se connecter avec Firebase
2. ✅ Créer une habitude
3. ✅ Vérifier qu'elle apparaît
4. ✅ Modifier l'habitude
5. ✅ Supprimer l'habitude

---

## 🎯 Checklist de Déploiement

### Avant le déploiement
- [ ] MongoDB Atlas configuré
- [ ] Clé Firebase Admin téléchargée et minifiée
- [ ] Code pushé sur GitHub
- [ ] `.gitignore` configuré (node_modules, .env)

### Sur Render.com
- [ ] Web Service créé
- [ ] Root Directory = `.backend`
- [ ] Variables d'environnement ajoutées:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI` (avec /habits)
  - [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON minifié)
- [ ] Déploiement réussi (logs verts)

### Tests
- [ ] `GET /` retourne le message de bienvenue
- [ ] `GET /api/status` retourne `database: "connected"`
- [ ] Flutter peut créer des habitudes
- [ ] Flutter peut lire les habitudes
- [ ] Flutter peut modifier les habitudes
- [ ] Flutter peut supprimer les habitudes

---

## 🔧 Maintenance

### Voir les logs

```bash
# Sur Render dashboard > Logs
# Ou utilisez Render CLI
render logs -f
```

### Redéployer

Render redéploie automatiquement à chaque push sur GitHub.

Pour forcer un redéploiement:
1. Dashboard Render
2. **Manual Deploy** > **Clear build cache & deploy**

### Mettre à jour les variables d'environnement

1. Dashboard Render
2. **Environment** > Modifier la variable
3. Cliquez **Save Changes**
4. Le service redémarre automatiquement

---

## 🚨 Dépannage

### Le service ne démarre pas

1. **Vérifiez les logs** sur Render
2. Recherchez les erreurs avec ❌
3. Vérifications communes:
   - Package.json a `"main": "app.js"`
   - `npm start` lance `node app.js`
   - Toutes les dépendances sont dans package.json

### Base de données non connectée

1. Testez l'URI MongoDB localement:
   ```bash
   # Dans .backend
   node -e "const mongoose = require('mongoose'); mongoose.connect('VOTRE_URI').then(() => console.log('OK')).catch(err => console.error(err));"
   ```

2. Vérifiez Network Access dans MongoDB Atlas
3. Assurez-vous que l'URI contient le mot de passe correct

### Firebase non initialisé

1. Vérifiez que le JSON est bien formaté:
   ```bash
   # Dans .backend
   node -e "console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))"
   ```

2. Assurez-vous qu'il n'y a pas d'erreur de syntaxe JSON
3. Vérifiez les `\\n` dans private_key

---

## 📞 Support

Pour d'autres problèmes:
- [Render Discord](https://render.com/discord)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)

---

## 🎉 Félicitations!

Une fois déployé, votre backend est:
- ✅ Sécurisé avec Firebase Auth
- ✅ Accessible depuis n'importe où
- ✅ Scalable automatiquement
- ✅ Avec base de données cloud
- ✅ Logs et monitoring inclus

**URL de votre API**: `https://VOTRE-SERVICE.onrender.com`
