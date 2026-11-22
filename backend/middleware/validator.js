/**
 * Centralized Input Validation and Sanitization Middleware for SIRAssist
 * Enforces strict server-side validation rules on all incoming payloads
 * to prevent malformed records, SQL injection attempts, and XSS payloads.
 */

// Helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const PIN_CODE_REGEX = /^\d{6}$/;
const MASKED_DOC_REGEX = /^[A-Za-z0-9\/\-\*_]{4,30}$/;

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

/**
 * Validate Registration Payload
 */
function validateRegister(req, res, next) {
  let { username, email, password, role, name, mobile, address } = req.body;

  username = sanitizeString(username);
  email = sanitizeString(email).toLowerCase();
  name = sanitizeString(name);
  mobile = sanitizeString(mobile);

  const errors = [];

  // Name validation
  if (!name || name.length < 3 || name.length > 100) {
    errors.push('Full name is required and must be between 3 and 100 characters.');
  } else if (!/^[a-zA-Z\s\.\'-]+$/.test(name)) {
    errors.push('Full name must contain only letters, dots, hyphens, and spaces.');
  }

  // Username validation
  if (!username || username.length < 3 || username.length > 50) {
    errors.push('Username is required and must be between 3 and 50 characters.');
  } else if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
    errors.push('Username may only contain letters, numbers, underscores, hyphens, or dots.');
  }

  // Email validation
  if (!email || !EMAIL_REGEX.test(email) || email.length > 100) {
    errors.push('A valid email address (max 100 characters) is required.');
  }

  // Mobile validation (10 digits Indian format)
  if (!mobile || !INDIAN_MOBILE_REGEX.test(mobile)) {
    errors.push('Mobile number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
  }

  // Password validation: minimum 8 characters with diversity
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must include at least one uppercase letter, one lowercase letter, and one number.');
  }

  // Role validation: Admin role cannot be created via public registration
  const allowedRoles = ['CITIZEN', 'VOLUNTEER'];
  if (!role || !allowedRoles.includes(role)) {
    errors.push('Valid role is required (CITIZEN or VOLUNTEER). Admin registration is restricted.');
  }

  // Address validation for Citizens
  if (role === 'CITIZEN' && address) {
    if (address.pin_code && !PIN_CODE_REGEX.test(address.pin_code)) {
      errors.push('Postal PIN code must contain exactly 6 digits.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  // Cleaned values passed forward
  req.body.username = username;
  req.body.email = email;
  req.body.name = name;
  req.body.mobile = mobile;
  next();
}

/**
 * Validate Login Payload
 */
function validateLogin(req, res, next) {
  let { email, password } = req.body;
  email = sanitizeString(email);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email/username and password are required.' });
  }

  if (email.length > 100 || password.length > 128) {
    return res.status(400).json({ error: 'Invalid credentials format.' });
  }

  req.body.email = email;
  next();
}

/**
 * Validate Citizen Profile Update Payload
 */
function validateProfile(req, res, next) {
  let { name, date_of_birth, gender, mobile, address } = req.body;
  const errors = [];

  if (name !== undefined) {
    name = sanitizeString(name);
    if (!name || name.length < 3 || name.length > 100) {
      errors.push('Full name must be between 3 and 100 characters.');
    } else if (!/^[a-zA-Z\s\.\'-]+$/.test(name)) {
      errors.push('Full name contains invalid characters.');
    }
    req.body.name = name;
  }

  if (mobile !== undefined) {
    mobile = sanitizeString(mobile);
    if (!INDIAN_MOBILE_REGEX.test(mobile)) {
      errors.push('Mobile number must be a valid 10-digit Indian number.');
    }
    req.body.mobile = mobile;
  }

  if (date_of_birth !== undefined && date_of_birth) {
    const dobDate = new Date(date_of_birth);
    const today = new Date();
    if (isNaN(dobDate.getTime())) {
      errors.push('Invalid date of birth format.');
    } else if (dobDate > today) {
      errors.push('Date of birth cannot be in the future.');
    }
  }

  if (gender !== undefined && !['Male', 'Female', 'Other', 'Prefer not to say'].includes(gender)) {
    errors.push('Invalid gender option.');
  }

  if (address) {
    if (address.pin_code && !PIN_CODE_REGEX.test(address.pin_code)) {
      errors.push('PIN code must contain exactly 6 digits.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  next();
}

/**
 * Validate Document Creation Payload
 */
function validateDocument(req, res, next) {
  let { document_type, document_reference_masked, issue_date } = req.body;
  const errors = [];

  const validTypes = [
    'Aadhaar (Masked)',
    'Voter ID',
    'Ration Card',
    'Utility Bill',
    'Bank Passbook',
    'Birth Certificate',
    'Passport',
    'Driving License'
  ];

  if (!document_type || !validTypes.includes(document_type)) {
    errors.push(`Document type must be one of: ${validTypes.join(', ')}`);
  }

  document_reference_masked = sanitizeString(document_reference_masked);
  if (!document_reference_masked || document_reference_masked.length < 4 || document_reference_masked.length > 50) {
    errors.push('Masked document reference must be between 4 and 50 characters.');
  } else if (!MASKED_DOC_REGEX.test(document_reference_masked)) {
    errors.push('Document reference contains invalid characters.');
  }

  if (!issue_date) {
    errors.push('Issue date is required.');
  } else {
    const d = new Date(issue_date);
    const today = new Date();
    if (isNaN(d.getTime())) {
      errors.push('Invalid issue date format.');
    } else if (d > today) {
      errors.push('Document issue date cannot be in the future.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  req.body.document_reference_masked = document_reference_masked;
  next();
}

/**
 * Validate Verification Request Creation Payload
 */
function validateVerificationRequest(req, res, next) {
  let { request_type, remarks, selected_document_ids } = req.body;
  const errors = [];

  const validRequestTypes = [
    'Record Verification',
    'Correction Assistance',
    'Missing Record Assistance',
    'Document Clarification',
    'General Assistance'
  ];

  if (!request_type || !validRequestTypes.includes(request_type)) {
    errors.push(`Request type must be one of: ${validRequestTypes.join(', ')}`);
  }

  if (remarks !== undefined) {
    remarks = sanitizeString(remarks);
    if (remarks.length > 500) {
      errors.push('Remarks/description cannot exceed 500 characters.');
    }
    req.body.remarks = remarks;
  }

  if (selected_document_ids !== undefined && !Array.isArray(selected_document_ids)) {
    errors.push('selected_document_ids must be an array of document IDs.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  next();
}

/**
 * Validate Assistance Request Payload
 */
function validateAssistanceRequest(req, res, next) {
  let { request_type, priority, notes } = req.body;
  const errors = [];

  const validTypes = [
    'Digital Assistance',
    'Form Filling',
    'Doorstep Visit',
    'Document Scan',
    'Language Help'
  ];

  if (!request_type || !validTypes.includes(request_type)) {
    errors.push(`Assistance type must be one of: ${validTypes.join(', ')}`);
  }

  if (priority && !['Low', 'Medium', 'High'].includes(priority)) {
    errors.push('Priority must be Low, Medium, or High.');
  }

  if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
    errors.push('Description/notes are required to explain your assistance need.');
  } else if (notes.trim().length > 500) {
    errors.push('Notes cannot exceed 500 characters.');
  } else {
    req.body.notes = notes.trim();
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  next();
}

/**
 * Validate Admin Status Update Payload
 */
function validateStatusUpdate(req, res, next) {
  let { status, remarks } = req.body;
  const errors = [];

  const validStatuses = [
    'DRAFT',
    'SUBMITTED',
    'DOCUMENTS_PENDING',
    'DOCUMENTS_SUBMITTED',
    'UNDER_REVIEW',
    'RESOLVED',
    'CANCELLED'
  ];

  if (!status || !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  if (remarks !== undefined) {
    remarks = sanitizeString(remarks);
    if (remarks.length > 500) {
      errors.push('Remarks cannot exceed 500 characters.');
    }
    req.body.remarks = remarks;
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateProfile,
  validateDocument,
  validateVerificationRequest,
  validateAssistanceRequest,
  validateStatusUpdate,
  EMAIL_REGEX,
  INDIAN_MOBILE_REGEX,
  PIN_CODE_REGEX
};
