import type { ErrorRequestHandler } from 'express'; import { ZodError } from 'zod';
export const notFound = (_req:any,res:any)=>res.status(404).json({message:'Route not found'});
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => { if (err instanceof ZodError) return res.status(400).json({ message: 'Validation failed', issues: err.flatten() }); const status = err.status ?? 500; res.status(status).json({ message: status === 500 ? 'Internal server error' : err.message }); };
