import { app } from './app'; import { connectDb } from './config/db'; import { env } from './config/env';
connectDb().then(()=>app.listen(env.PORT,()=>console.log(`InternFlow API listening on ${env.PORT}`))).catch(err=>{ console.error('Failed to start API',err); process.exit(1); });
