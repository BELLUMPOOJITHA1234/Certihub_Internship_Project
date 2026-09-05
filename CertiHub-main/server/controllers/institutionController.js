const admin = require('firebase-admin');
const { uploadToCloudinary } = require('../utils/cloudinary');
const path = require('path');
const { processDocument } = require('./certController');

exports.createHOD = async (req, res) => {
  const { email, department, name } = req.body;
  const institutionId = req.user.uid; // The Institutional Admin's ID
  const domain = email.split('@')[1];
  const defaultPassword = `${domain}@123`;

  try {
    // 1. Create User in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password: defaultPassword,
      displayName: name,
    });

    // 2. Set User Document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      department,
      institutionId,
      role: 'hod',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ 
      message: `HOD account created for ${name}`, 
      uid: userRecord.uid,
      tempPassword: defaultPassword 
    });
  } catch (error) {
    console.error('Error creating HOD:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('users')
      .where('institutionId', '==', req.user.uid)
      .where('role', '==', 'hod')
      .get();
    
    const hods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(hods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.batchIssue = async (req, res) => {
  try {
    const { domainScope, schoolDomain, targetEmail } = req.body;
    const files = req.files; // Array of files

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided for batch issuance.' });
    }

    const issuedRecords = [];

    for (const file of files) {
      // 1. Determine student email based on scope
      let studentEmail = '';
      if (domainScope === 'internal') {
        if (!schoolDomain) throw new Error("School domain is required for internal issuance.");
        const filenameWithoutExt = path.parse(file.originalname).name;
        studentEmail = `${filenameWithoutExt}@${schoolDomain}`.toLowerCase();
      } else {
        if (!targetEmail) throw new Error("Target email is required for external issuance.");
        studentEmail = targetEmail.toLowerCase();
      }

      // 2. Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(file.buffer);
      
      // 3. AI/OCR Metadata Extraction
      let extractedTitle = 'Institutional Certificate';
      let extractedCategory = 'Degree';
      let extractedSkills = [];
      let candidateName = '';
      let aiSummary = '';
      let resumeBullets = [];
      let extractedIssuer = req.user.email || "Academic Institution";

      try {
        console.log(`Analyzing document for ${studentEmail}...`);
        const { aiData } = await processDocument(file.buffer, file.mimetype);
        
        // Default to admin's domain if AI doesn't extract one
        const adminDomain = req.user.email ? req.user.email.split('@')[1] : "CertiHub Institution";
        extractedIssuer = adminDomain;

        if (aiData) {
          if (aiData.certificateTitle && !aiData.certificateTitle.toLowerCase().includes('unknown')) {
            extractedTitle = aiData.certificateTitle;
          }
          if (aiData.category) extractedCategory = aiData.category;
          if (aiData.skills && Array.isArray(aiData.skills)) extractedSkills = aiData.skills;
          if (aiData.candidateName) candidateName = aiData.candidateName;
          if (aiData.aiSummary) aiSummary = aiData.aiSummary;
          if (aiData.resumeBullets) resumeBullets = aiData.resumeBullets;
          if (aiData.organization) extractedIssuer = aiData.organization;
        }
      } catch (err) {
        console.error("AI Extraction Failed for batch file, using fallbacks.", err);
        const adminDomain = req.user.email ? req.user.email.split('@')[1] : "CertiHub Institution";
        extractedIssuer = adminDomain;
      }
      
      // 4. Save to Firestore
      const newCert = {
        studentEmail: studentEmail,
        candidateName: candidateName,
        cloudinaryUrl: cloudinaryResult.secure_url,
        consentStatus: 'pending',
        isInstitutional: true,
        domainScope: domainScope,
        verificationStatus: 'verified',
        title: extractedTitle,
        category: extractedCategory,
        skills: extractedSkills,
        aiSummary: aiSummary,
        resumeBullets: resumeBullets,
        issuer: extractedIssuer,
        issuerId: req.user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await admin.firestore().collection('certificates').add(newCert);
      issuedRecords.push({ id: docRef.id, email: studentEmail });
    }

    res.status(200).json({ 
      message: `Successfully issued ${issuedRecords.length} certificates.`,
      records: issuedRecords 
    });

  } catch (error) {
    console.error('Error in batchIssue:', error);
    res.status(500).json({ error: error.message || 'Failed to process batch issuance.' });
  }
};
