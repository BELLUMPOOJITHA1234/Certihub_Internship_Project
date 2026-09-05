const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const apiRoutes = require('./routes/api');

dotenv.config({ override: true });

// Initialize Firebase Admin
try {
  let serviceAccount;
  
  // Try loading from file first (standard local dev or Render Secret Files)
  try {
    const fs = require('fs');
    const path = require('path');
    
    const localPath = path.join(__dirname, 'firebase-service-account.json');
    const renderPath = '/etc/secrets/firebase-service-account.json';
    
    if (fs.existsSync(localPath)) {
      serviceAccount = require(localPath);
    } else if (fs.existsSync(renderPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(renderPath, 'utf8'));
      console.log("Firebase Admin initialized via Render Secret File.");
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Fallback: Try loading from environment variable
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log("Firebase Admin initialized via Environment Variable.");
    } else {
      throw new Error("Missing both firebase-service-account.json and FIREBASE_SERVICE_ACCOUNT env var.");
    }
  } catch (fileError) {
    throw fileError;
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully.");
    
    // Bootstrap Admin User Role
    const db = admin.firestore();
    (async () => {
      try {
        const usersRef = db.collection('users');
        const adminQuery = await usersRef.where('email', '==', 'admin@certihub.com').limit(1).get();
        if (!adminQuery.empty) {
          const adminDoc = adminQuery.docs[0];
          if (adminDoc.data().role !== 'admin') {
            await adminDoc.ref.update({ role: 'admin' });
            console.log("Admin user role bootstrapped to 'admin'.");
          }
        }
      } catch (err) {
        console.warn("Bootstrap check failed:", err.message);
      }
    })();
  }
} catch (error) {
  console.warn("Firebase Admin failed to initialize:", error.message);
  console.warn("Auth middleware and Admin features will be disabled or fail.");
}

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://certihub-taupe.vercel.app" // Fallback for the user's specific URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
