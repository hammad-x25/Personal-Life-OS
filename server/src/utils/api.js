export const ok = (res, data = null, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });
export class AppError extends Error {
  constructor(message, status = 400, code = "BAD_REQUEST", details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
