const admin = require('firebase-admin');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (admin.apps.length === 0) {
    return res.status(500).json({ error: 'Server configuration error: Firebase Admin not initialized. Please add firebase-service-account.json.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Fetch user role from Firestore
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    req.user = {
      ...decodedToken,
      role: userData.role || 'student', // Default to student
      institutionId: userData.institutionId || null,
      department: userData.department || null
    };
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]` });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };
