import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({ NODE_ENV: z.string().default('development'), PORT: z.coerce.number().default(4000), MONGODB_URI: z.string().min(1), JWT_ACCESS_SECRET: z.string().min(16), JWT_REFRESH_SECRET: z.string().min(16), JWT_ACCESS_EXPIRES_IN: z.string().default('15m'), JWT_REFRESH_EXPIRES_IN: z.string().default('30d'), CORS_ORIGIN: z.string().default('http://localhost:5173') });
export const env = schema.parse(process.env);
