import type { Request, Response } from 'express';
import app from '../src/server/app.ts';

export default function handler(req: Request, res: Response) {
  // 1. CORS headers on all Vercel invocations
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-razorpay-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Normalize and resolve the true requested URL across Vercel routing layers
  const rawUrl = req.url || '';
  const matchedPath = (req.headers['x-matched-path'] as string) || '';
  const forwardedUri = (req.headers['x-forwarded-uri'] as string) || '';
  const originalUri = (req.headers['x-original-uri'] as string) || '';

  if (matchedPath && !matchedPath.includes('/api/index')) {
    const qIndex = rawUrl.indexOf('?');
    const query = qIndex !== -1 ? rawUrl.slice(qIndex) : '';
    req.url = matchedPath.includes('?') ? matchedPath : `${matchedPath}${query}`;
  } else if (forwardedUri && !forwardedUri.includes('/api/index')) {
    req.url = forwardedUri;
  } else if (originalUri && !originalUri.includes('/api/index')) {
    req.url = originalUri;
  } else if (rawUrl.includes('/api/index.ts') || rawUrl.includes('/api/index')) {
    // If Vercel passed query parameters with matched capture group (e.g. ?0=slots/available)
    const qIndex = rawUrl.indexOf('?');
    if (qIndex !== -1) {
      const searchParams = new URLSearchParams(rawUrl.slice(qIndex));
      const group0 = searchParams.get('0') || searchParams.get('1');
      if (group0) {
        searchParams.delete('0');
        searchParams.delete('1');
        const rest = searchParams.toString();
        req.url = `/api/${group0}${rest ? `?${rest}` : ''}`;
      }
    }
  }

  // Ensure leading /api prefix is consistently present for Express routing
  if (req.url && !req.url.startsWith('/api/') && !req.url.startsWith('/api?') && req.url !== '/api') {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }

  // 3. Direct Health Check Fast Path (Zero-dependency, immediate response)
  const url = req.url || '';
  if (
    url === '/api/health' ||
    url === '/health' ||
    url === '/api/health/' ||
    url === '/health/' ||
    url.startsWith('/api/health?') ||
    url.startsWith('/health?')
  ) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      ok: true,
      status: 'ok',
      environment: process.env.VERCEL ? 'vercel' : (process.env.NODE_ENV || 'development'),
      service: 'aesthetic-dental-api',
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Delegate to Express API Engine
  return app(req, res);
}
