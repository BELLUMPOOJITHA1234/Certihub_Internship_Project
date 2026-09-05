const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const { cloudinary, uploadToCloudinary } = require('../utils/cloudinary');
const { analyzeTextWithAI, analyzeImageWithAI } = require('../utils/aiService');
const axios = require('axios');

const processDocument = async (fileBuffer, mimetype) => {
  // 1. Try Engine A: Multimodal Vision AI (High Precision)
  let visionData = null;
  const isImage = mimetype.startsWith('image/');
  
  if (isImage) {
    console.log("--- ENGINE A: VISION AI (BASE64) ---");
    try {
      const base64Image = fileBuffer.toString('base64');
      visionData = await analyzeImageWithAI(base64Image);
    } catch (err) {
      console.error("Vision AI failed, falling back to OCR Engine B...", err.message);
    }
  }

  // 2. Try Engine B: OCR + Text AI (Reliable Fallback)
  let text = '';
  const fileExtension = mimetype.includes('pdf') ? 'pdf' : 'image';

  if (fileExtension === 'pdf') {
    try {
      console.log("Parsing PDF with pdf-parse...");
      const pdfData = await pdfParse(fileBuffer);
      text = pdfData.text;
      if (!text || text.trim().length < 5) {
        console.warn("PDF extraction returned very little text. Likely a scan.");
      }
    } catch (err) {
      console.error("PDF Parse error", err);
    }
  } else {
    const result = await Tesseract.recognize(fileBuffer, 'eng');
    text = result.data.text;
  }

  let ocrAiData = null;
  if (text) {
    try {
      ocrAiData = await analyzeTextWithAI(text);
    } catch (err) {
      console.error("Text AI failed...", err.message);
    }
  }

  // 3. COMPARE AND MERGE
  // If Vision found a title and OCR didn't, use Vision.
  // If both found titles, Vision is usually more accurate for layout.
  const finalAiData = visionData && visionData.certificateTitle && !visionData.certificateTitle.toLowerCase().includes('unknown')
    ? visionData 
    : (ocrAiData || visionData);

  return { aiData: finalAiData, text };
};

const analyzeCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No certificate file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const mimetype = req.file.mimetype;

    // 1. Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(fileBuffer);
    const cloudinaryUrl = cloudinaryResult.secure_url;

    // 2. Process document
    const { aiData, text } = await processDocument(fileBuffer, mimetype);
    
    console.log("--- RAW OCR TEXT ---");
    console.log(text.substring(0, 500));
    console.log("--------------------");

    // 3. Return combined result
    return res.status(200).json({
      cloudinaryUrl,
      aiData,
      rawText: text
    });

  } catch (error) {
    console.error('Error in analyzeCertificate:', error);
    return res.status(500).json({ error: 'Failed to analyze certificate', details: error.message });
  }
};

const reAnalyzeCertificate = async (req, res) => {
  const { id, base64Image, mimetype } = req.body;
  if (!id || !base64Image) return res.status(400).json({ error: 'ID and base64 data are required' });

  try {
    // We now use the base64 data provided by the client to bypass 401s
    const fileBuffer = Buffer.from(base64Image, 'base64');
    const { aiData, text } = await processDocument(fileBuffer, mimetype || 'image/jpeg');

    return res.status(200).json({
      message: 'Certificate successfully re-analyzed',
      aiData,
      rawText: text
    });
  } catch (error) {
    console.error('Error in reAnalyzeCertificate:', error);
    return res.status(500).json({ error: 'Failed to re-analyze certificate', details: error.message });
  }
};

exports.deleteCertificateFile = async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Extract public_id from Cloudinary URL
    // URL Format: .../upload/v1234567/certihub/public_id.ext
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) throw new Error('Invalid Cloudinary URL');

    const pathAfterUpload = url.substring(uploadIdx + 8); // Skip "/upload/"
    const pathParts = pathAfterUpload.split('/');
    
    // Remove the version part (starts with 'v')
    const finalPathParts = pathParts[0].startsWith('v') ? pathParts.slice(1) : pathParts;
    
    // Join back and remove extension
    const fullPublicIdWithExt = finalPathParts.join('/');
    const publicId = fullPublicIdWithExt.split('.')[0];

    console.log(`Attempting to delete Cloudinary file: ${publicId}`);

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary Delete Result:", result);

    return res.status(200).json({ message: 'File deleted from Cloudinary', result });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return res.status(500).json({ error: 'Failed to delete file from Cloudinary' });
  }
};

module.exports = { analyzeCertificate, reAnalyzeCertificate, deleteCertificateFile: exports.deleteCertificateFile, processDocument };
