export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';
  let details = err.details || null;
  if (err.name === 'ValidationError') { status = 422; code = 'MODEL_VALIDATION_ERROR'; details = Object.values(err.errors).map(item => ({ field: item.path, message: item.message })); }
  if (err.name === 'CastError') { status = 400; code = 'INVALID_IDENTIFIER'; message = `Invalid ${err.path}`; }
  if (err.code === 11000) { status = 409; code = 'DUPLICATE_RECORD'; message = 'A record with those values already exists'; details = err.keyValue; }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') { status = 401; code = 'INVALID_TOKEN'; message = 'Authentication token is invalid or expired'; }
  if (err.type === 'entity.parse.failed') { status = 400; code = 'INVALID_JSON'; message = 'Request body contains invalid JSON'; }
  if (status >= 500) console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  res.status(status).json({ success: false, code, message, details });
}
