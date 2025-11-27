// ============================================
// Firebase Admin SDK Initialization
// ============================================

const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK
 * 
 * For local development:
 * - Download service account key from Firebase Console
 * - Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable with JSON string
 * 
 * For production (Render/Heroku):
 * - Set FIREBASE_SERVICE_ACCOUNT_KEY as environment variable with entire JSON
 */

let firebaseApp;

try {
    // Check if service account key is provided
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables');
        console.warn('⚠️  Firebase authentication will NOT work');
        console.warn('📖 See CONFIGURATION.md for setup instructions');
    } else {
        // Parse the service account key (it should be a JSON string)
        const serviceAccount = JSON.parse(serviceAccountKey);

        // Initialize Firebase Admin
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
    }
} catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    console.error('📖 Please check your FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
}

module.exports = admin;
