const admin = require('firebase-admin');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { processDocument } = require('./certController');

exports.smartBatchIssue = async (req, res) => {
  try {
    const { mappingData } = req.body;
    const files = req.files; // Array of files

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No certificate files provided.' });
    }

    if (!mappingData) {
      return res.status(400).json({ error: 'No mapping CSV data provided.' });
    }

    let parsedMapping = [];
    try {
      parsedMapping = JSON.parse(mappingData);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid mapping data format.' });
    }

    const issuedRecords = [];

    for (const file of files) {
      console.log(`Analyzing document for smart batch issue...`);
      
      let candidateName = '';
      let extractedTitle = 'Professional Certificate';
      let extractedCategory = 'Achievement';
      let extractedSkills = [];
      let aiSummary = '';
      let resumeBullets = [];
      let extractedIssuer = req.user.email || "Corporate Organization";

      // 1. AI/OCR Metadata Extraction
      try {
        const { aiData } = await processDocument(file.buffer, file.mimetype);
        if (aiData) {
          if (aiData.candidateName) candidateName = aiData.candidateName;
          if (aiData.certificateTitle && !aiData.certificateTitle.toLowerCase().includes('unknown')) {
            extractedTitle = aiData.certificateTitle;
          }
          if (aiData.category) extractedCategory = aiData.category;
          if (aiData.skills && Array.isArray(aiData.skills)) extractedSkills = aiData.skills;
          if (aiData.aiSummary) aiSummary = aiData.aiSummary;
          if (aiData.resumeBullets) resumeBullets = aiData.resumeBullets;
          if (aiData.organization) extractedIssuer = aiData.organization;
        }
      } catch (err) {
        console.error("AI Extraction Failed for batch file.", err);
      }

      if (!candidateName) {
        console.warn("Could not extract a name from the certificate. Skipping.");
        continue;
      }

      // 2. Match Name with CSV
      // We will try a simple includes/exact match (case insensitive)
      const normalizedCandidate = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');
      let matchedEmail = null;

      for (const record of parsedMapping) {
        const normalizedEmployee = record.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedCandidate.includes(normalizedEmployee) || normalizedEmployee.includes(normalizedCandidate)) {
          matchedEmail = record.email;
          break;
        }
      }

      if (!matchedEmail) {
        console.warn(`No match found in CSV for extracted name: ${candidateName}. Skipping.`);
        continue;
      }

      // 3. Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(file.buffer);

      // 4. Save to Firestore
      const newCert = {
        studentEmail: matchedEmail,
        candidateName: candidateName,
        cloudinaryUrl: cloudinaryResult.secure_url,
        consentStatus: 'pending',
        isInstitutional: false,
        domainScope: 'external',
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
      issuedRecords.push({ id: docRef.id, email: matchedEmail, candidateName });
    }

    res.status(200).json({ 
      message: `Successfully mapped and issued ${issuedRecords.length} out of ${files.length} certificates.`,
      records: issuedRecords 
    });

  } catch (error) {
    console.error('Error in smartBatchIssue:', error);
    res.status(500).json({ error: error.message || 'Failed to process smart batch issuance.' });
  }
};
