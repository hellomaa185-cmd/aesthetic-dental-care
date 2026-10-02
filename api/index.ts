import type { Request, Response } from 'express';
import app from '../src/server/app';

export default function handler(req: Request, res: Response) {
  // 1. CORS headers on all Vercel invocations
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-razorpay-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Direct Health Check Fast Path (Zero-dependency, immediate response)
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

  // 3. Delegate to Express API Engine
  return app(req, res);
}
