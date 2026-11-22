const express  = require('express');
const router   = express.Router();
const { upload } = require('../middleware/uploadMiddleware');
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/documentUploadController');

// Citizen: upload new document
router.post(
  '/upload',
  verifyToken, requireRole('CITIZEN'),
  upload.single('document_file'),
  ctrl.uploadDocument
);

// Citizen: list own documents
router.get('/my', verifyToken, requireRole('CITIZEN'), ctrl.getMyDocuments);

// Citizen: get single document detail + review history
router.get('/:id', verifyToken, ctrl.getDocumentDetail);

// Citizen: resubmit corrected document
router.post(
  '/:id/resubmit',
  verifyToken, requireRole('CITIZEN'),
  upload.single('document_file'),
  ctrl.resubmitDocument
);

// Secure file streaming (Citizen + Volunteer + Admin)
router.get('/:id/versions/:versionId/file', verifyToken, ctrl.streamDocumentFile);

module.exports = router;
