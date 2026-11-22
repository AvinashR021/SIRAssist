const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const uploadController = require('../controllers/documentUploadController');
const { upload } = require('../middleware/uploadMiddleware');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateDocument } = require('../middleware/validator');

// ─── Legacy Document Reference Endpoints (Preserved for backwards compatibility) ─
router.get('/requirements', documentController.getRequirements);
router.get('/', verifyToken, documentController.getDocuments);
router.post('/', verifyToken, validateDocument, documentController.addDocument);
router.delete('/:id', verifyToken, documentController.deleteDocument);

// ─── Phase 2 & 7: Physical Document Upload, Retrieval & Resubmission Workflow ────
// Upload a physical document file (Citizen)
router.post(
  '/upload',
  verifyToken,
  requireRole('CITIZEN'),
  upload.single('document_file'),
  uploadController.uploadDocument
);

// Get all uploaded document files belonging to the logged-in citizen
router.get('/my', verifyToken, requireRole('CITIZEN'), uploadController.getMyDocuments);

// Get specific document details with version and review history
router.get('/:id', verifyToken, uploadController.getDocumentDetail);

// Get feedback specifically for a document
router.get('/:id/feedback', verifyToken, uploadController.getDocumentDetail);

// Resubmit a corrected document file (Citizen)
router.post(
  '/:id/resubmit',
  verifyToken,
  requireRole('CITIZEN'),
  upload.single('document_file'),
  uploadController.resubmitDocument
);

// Secure streaming of document files (authenticated & authorized: Citizen owner, assigned Volunteer, or Admin)
router.get('/:id/versions/:versionId/file', verifyToken, uploadController.streamDocumentFile);

module.exports = router;
