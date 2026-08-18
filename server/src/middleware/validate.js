import { AppError } from '../utils/api.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    throw new AppError('Validation failed', 422, 'VALIDATION_ERROR', result.error.issues.map(issue => ({ field: issue.path.join('.') || source, message: issue.message })));
  }
  req[source] = result.data;
  next();
};
