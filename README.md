# Habit Tracker Backend - Secure Edition 🚀

Production-ready Node.js backend with Firebase Authentication, MongoDB, and Express.

## Features

- 🔐 **Firebase Authentication** - Secure token-based authentication
- 🛡️ **Authorization** - Users can only access their own habits
- 🗄️ **MongoDB** - Scalable NoSQL database
- ⚡️ **Express** - Fast, minimalist web framework  
- 🔒 **Security** - Helmet + Rate limiting + CORS
- ✅ **Validation** - Request validation and error handling
- 📊 **Indexing** - Optimized database queries

## Project Structure

```
.backend/
├── app.js                    # Main application entry point
├── firebase.js               # Firebase Admin SDK initialization
├── models/
│   └── Habit.js              # Mongoose Habit model
├── middleware/
│   └── auth.js               # Firebase token verification
├── routes/
│   └── habitRoutes.js        # Protected CRUD routes
├── package.json              # Dependencies
├── .env                      # Environment variables (create from .env.example)
└── .env.example              # Environment template
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)
- Firebase project with Authentication enabled

## Quick Start

### 1. Install Dependencies

```bash
cd .backend
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/habits
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

> **Important**: The `FIREBASE_SERVICE_ACCOUNT_KEY` must be the entire JSON content as a single line

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication

All `/habits` endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Endpoints

#### 🏠 Health Check (Public)
```http
GET /
```

Response:
```json
{
  "success": true,
  "message": "🚀 Habit Tracker API - Secure Edition",
  "version": "2.0.0",
  "status": "running"
}
```

#### 📊 API Status (Public)
```http
GET /api/status
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-27T12:00:00.000Z"
}
```

#### ✅ Create Habit (Protected)
```http
POST /habits
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Exercise"
}
```

Response:
```json
{
  "success": true,
  "message": "Habit created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "firebase-uid",
    "name": "Exercise",
    "createdAt": "2025-11-27T12:00:00.000Z",
    "updatedAt": "2025-11-27T12:00:00.000Z"
  }
}
```

#### 📋 Get All Habits (Protected)
```http
GET /habits
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "firebase-uid",
      "name": "Exercise",
      "createdAt": "2025-11-27T12:00:00.000Z",
      "updatedAt": "2025-11-27T12:00:00.000Z"
    }
  ]
}
```

#### ✏️ Update Habit (Protected)
```http
PUT /habits/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Morning Exercise"
}
```

> **Security**: Can only update your own habits

#### 🗑️ Delete Habit (Protected)
```http
DELETE /habits/:id
Authorization: Bearer <token>
```

> **Security**: Can only delete your own habits

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Habit name is required"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Please login again"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "message": "Habit not found or you do not have permission"
}
```

## Security Features

### Firebase Token Verification
- All `/habits` routes require valid Firebase token
- Tokens verified using Firebase Admin SDK
- Expired tokens automatically rejected

### Authorization
- Users can only access their own habits
- `userId` extracted from Firebase token (not request body)
- All queries filtered by authenticated user

### Rate Limiting
- 100 requests per 15 minutes per IP
- Prevents brute force attacks

### Helmet
- Sets secure HTTP headers
- Prevents common vulnerabilities

### CORS
- Configurable allowed origins
- Set `CORS_ORIGIN` in `.env` for production

## Database

### MongoDB Schema

```javascript
{
  userId: String,        // Firebase UID (indexed)
  name: String,          // Habit name (required, 1-100 chars)
  createdAt: Date,       // Auto-generated
  updatedAt: Date        // Auto-managed
}
```

### Indexes

```javascript
// Single index for userId
{ userId: 1 }

// Compound index for efficient sorted queries
{ userId: 1, createdAt: -1 }
```

## Deployment

### Render.com

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables:
   - `MONGODB_URI`
   - `FIREBASE_SERVICE_ACCOUNT_KEY`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=your-frontend-url`

### Railway.app

1. Create new project
2. Connect GitHub repository
3. Add MongoDB plugin
4. Set environment variables (same as Render)

### Heroku

```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
heroku config:set NODE_ENV=production
git push heroku main
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Yes | Firebase service account JSON |
| `CORS_ORIGIN` | No | Allowed origins (default: *) |

## Testing

### Manual Testing with curl

**Get token from Flutter app:**
```dart
final token = await FirebaseAuth.instance.currentUser?.getIdToken();
print(token);
```

**Test API:**
```bash
# Test without token (should fail)
curl http://localhost:3000/habits

# Test with token (should work)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/habits
```

## Troubleshooting

### Firebase Admin Error
```
Error: Could not load the default credentials
```
**Solution**: Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is properly set in `.env`

### MongoDB Connection Error
```
MongoDB connection error: ...
```
**Solution**: 
- Check `MONGODB_URI` is correct
- Ensure MongoDB is running
- Check network/firewall settings

### Token Verification Failed
```
Token verification failed: auth/id-token-expired
```
**Solution**: Token expired. Flutter app should request new token with:
```dart
await user.getIdToken(true); // Force refresh
```

## Support

For issues or questions:
- Check the [implementation plan](../implementation_plan.md)
- Review the [configuration guide](./CONFIGURATION.md)
- Check server logs for detailed error messages

## License

ISC
