# Firebase Configuration Guide

This guide explains how to set up Firebase Admin SDK for the backend.

## Prerequisites

- Firebase project created
- Authentication enabled in Firebase Console

## Step 1: Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ > **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** (a JSON file will download)

## Step 2: Prepare the Service Account Key

The downloaded JSON file looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Step 3: Add to Environment Variables

### Local Development

1. **Minify the JSON** (remove newlines and extra spaces):
   ```
   {"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n","client_email":"..."}
   ```

2. **Add to `.env` file**:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```

> **Note**: Make sure to escape newlines in the private key as `\\n`

### Production (Render/Heroku/Railway)

1. Go to your hosting platform's environment variables section
2. Create a new variable: `FIREBASE_SERVICE_ACCOUNT_KEY`
3. Paste the **entire minified JSON** as the value
4. Save and redeploy

## Step 4: Verify Setup

Start your server:

```bash
npm run dev
```

You should see:
```
✅ Firebase Admin SDK initialized successfully
```

If you see an error:
```
❌ Error initializing Firebase Admin SDK
```

Check:
- JSON is properly formatted (no extra quotes or escaping issues)
- All fields are present in the JSON
- `.env` file is in the correct location

## Testing

### Get a Firebase Token (Flutter)

```dart
import 'package:firebase_auth/firebase_auth.dart';

final user = FirebaseAuth.instance.currentUser;
final token = await user?.getIdToken();
print('Token: $token');
```

### Test Backend Authentication

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:3000/habits
```

Expected response (authenticated):
```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

Expected response (not authenticated):
```json
{
  "success": false,
  "error": "Authorization header missing or invalid"
}
```

## Common Issues

### Issue: "Could not load the default credentials"

**Cause**: `FIREBASE_SERVICE_ACCOUNT_KEY` not found or invalid

**Solution**:
1. Verify `.env` file exists in `.backend/` directory
2. Check variable name is exactly `FIREBASE_SERVICE_ACCOUNT_KEY`
3. Ensure JSON is on a single line
4. Restart the server

### Issue: "Unexpected token" when parsing JSON

**Cause**: JSON formatting issue

**Solution**:
1. Ensure the JSON is properly minified
2. Escape special characters (especially `\n` in private_key)
3. Don't add extra quotes around the JSON

### Issue: "Invalid token" error in API requests

**Cause**: Token is expired or invalid

**Solution**:
1. Get a fresh token from Firebase Auth
2. Use `getIdToken(true)` to force refresh:
   ```dart
   final token = await user?.getIdToken(true); // Force refresh
   ```

## Security Best Practices

1. **Never commit service account keys to Git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates

2. **Rotate keys periodically**
   - Generate new keys every 90 days
   - Revoke old keys in Firebase Console

3. **Restrict service account permissions**
   - Only grant necessary permissions
   - Use separate accounts for dev/prod

4. **Use environment-specific keys**
   - Different keys for development and production
   - Never use production keys locally

## Alternative: Using Service Account File (Not Recommended)

If you prefer using a file instead of environment variable:

1. Place `serviceAccountKey.json` in `.backend/` directory
2. Update `firebase.js`:
   ```javascript
   const serviceAccount = require('./serviceAccountKey.json');
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount),
   });
   ```

3. **Important**: Add to `.gitignore`:
   ```
   serviceAccountKey.json
   ```

> **Warning**: This method is less secure for deployment. Use environment variables in production.

## Next Steps

Once Firebase is configured:

1. ✅ Test authentication with a real Firebase token
2. ✅ Deploy to production
3. ✅ Update Flutter app to use production URL
4. ✅ Monitor logs for authentication errors

## Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [Environment Variables Guide](https://www.npmjs.com/package/dotenv)
