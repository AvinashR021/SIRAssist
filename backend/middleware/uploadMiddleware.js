/**
 * SIRAssist – Multer upload middleware
 * Stores files in backend/uploads/ (outside public web root).
 * Validates: file type, file size, generates safe storage keys.
 */
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Ensure upload directory exists (never inside public/ or dist/)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Generate a random storage key – never expose original filename as server path
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const storageKey = `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, storageKey);
  }
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: PDF, JPG, JPEG, PNG.'), false);
  }
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

module.exports = { upload, UPLOAD_DIR };
