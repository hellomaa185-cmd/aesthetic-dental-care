import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response } from 'express';
import app from './src/server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else if (!process.env.VERCEL) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Aesthetic Dental Clinic] Server running on port ${PORT}`);
  });
}

export default app;
export { app };
