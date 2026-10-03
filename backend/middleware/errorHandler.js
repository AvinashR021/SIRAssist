function errorHandler(err, req, res, next) {
  console.error('[Error Handler Log]:', err.stack || err.message);

  const statusCode = err.status || 500;
  const message = err.userFacingMessage || err.message || 'An unexpected internal database server error occurred.';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR'
  });
}

module.exports = errorHandler;
