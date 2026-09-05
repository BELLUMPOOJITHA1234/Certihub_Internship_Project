const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeCertificate, reAnalyzeCertificate, deleteCertificateFile } = require('../controllers/certController');
const { getCareerAdvice, generateLinkedInPost, getSharePage, chatWithAI } = require('../controllers/careerController');
const { getAdminStats } = require('../controllers/adminController');
const { createHOD, getDepartments, batchIssue } = require('../controllers/institutionController');
const { createMentor, linkStudent } = require('../controllers/hodController');
const { getMyStudents, verifyCertificate } = require('../controllers/mentorController');
const { smartBatchIssue } = require('../controllers/organizationController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Multer config for temporary memory storage before Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', verifyToken, upload.single('certificate'), analyzeCertificate);
router.post('/re-analyze', verifyToken, reAnalyzeCertificate);
router.post('/career-advice', verifyToken, getCareerAdvice);
router.post('/generate-post', verifyToken, generateLinkedInPost);
router.post('/chat', verifyToken, chatWithAI);
router.get('/share/:id', getSharePage); // Public
router.post('/delete-file', verifyToken, deleteCertificateFile);
router.get('/admin/stats', verifyToken, checkRole(['admin', 'institution']), getAdminStats);

// Institution Routes
router.post('/institution/create-hod', verifyToken, checkRole(['institution']), createHOD);
router.get('/institution/departments', verifyToken, checkRole(['institution', 'hod', 'mentor']), getDepartments);
router.post('/institution/batch-issue', verifyToken, checkRole(['institution']), upload.array('certificates'), batchIssue);

// HOD Routes
router.post('/hod/create-mentor', verifyToken, checkRole(['hod']), createMentor);
router.post('/hod/link-student', verifyToken, checkRole(['hod']), linkStudent);

// Mentor Routes
router.get('/mentor/students', verifyToken, checkRole(['mentor']), getMyStudents);
router.post('/mentor/verify', verifyToken, checkRole(['mentor']), verifyCertificate);

// Organization Routes
router.post('/organization/smart-batch-issue', verifyToken, checkRole(['org_admin']), upload.array('certificates'), smartBatchIssue);

module.exports = router;
