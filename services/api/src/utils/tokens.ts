import jwt, { type SignOptions } from 'jsonwebtoken'; import crypto from 'crypto'; import { env } from '../config/env';
export const signAccessToken = (userId: string, role='student') => jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as SignOptions);
export const signRefreshToken = (userId: string, tokenId: string) => jwt.sign({ sub: userId, jti: tokenId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions);
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
