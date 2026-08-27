import crypto from 'crypto';

export function requestContext(req, res, next) {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  res.on('finish', () => { if (res.statusCode >= 500) console.error(JSON.stringify({ requestId, method: req.method, path: req.originalUrl, statusCode: res.statusCode })); });
  next();
}
