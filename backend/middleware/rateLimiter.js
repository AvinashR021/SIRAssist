/**
 * In-Memory Rate Limiting Middleware for SIRAssist
 * Protects critical authentication endpoints (/api/auth/login, /api/auth/register)
 * against brute-force password guessing and automated credential stuffing.
 */

const attempts = new Map();

/**
 * Creates a rate limiter instance
 * @param {Object} options 
 * @param {number} options.windowMs Window duration in milliseconds (default: 15 mins)
 * @param {number} options.max Maximum requests per windowMs (default: 10 attempts)
 * @param {string} options.message Error message returned when limit exceeded
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 10;
  const message = options.message || 'Too many attempts from this IP address. Please try again after 15 minutes.';

  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown-client';
    const key = `${req.baseUrl || ''}${req.path}:${clientIp}`;
    const now = Date.now();

    const record = attempts.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset window if expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    attempts.set(key, record);

    // Set standard RateLimit HTTP headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    next();
  };
}

// Preset rate limiters
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Security Alert: Too many login/registration attempts. Temporary rate limit triggered. Please wait 15 minutes.'
});

module.exports = {
  createRateLimiter,
  authLimiter
};
