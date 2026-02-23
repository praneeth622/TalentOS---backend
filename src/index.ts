import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import taskRoutes from './routes/task.routes';
import dashboardRoutes from './routes/dashboard.routes';
import aiRoutes from './routes/ai.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { validateEnv } from './config/env';

validateEnv();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Support comma-separated FRONTEND_URL so one build works for local + prod
// e.g. FRONTEND_URL="https://talentos.praneethd.xyz,http://localhost:3000"
if (!process.env.FRONTEND_URL) {
  console.warn(
    '⚠️  [CORS] FRONTEND_URL env var is NOT set — falling back to http://localhost:3000 only. ' +
    'Production requests from your deployed frontend WILL be blocked. ' +
    'Set FRONTEND_URL on your hosting platform (Render → Environment tab).'
  );
}

const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, '')); // strip trailing slashes

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / Postman (no origin header)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// cors() MUST come before helmet() — helmet can otherwise strip
// the Access-Control-Allow-Origin header on preflight responses.
// app.use handles all methods including OPTIONS preflight automatically.
app.use(cors(corsOptions));

app.use(
  helmet({
    // Disable crossOriginResourcePolicy so helmet doesn't block cross-origin
    // requests that cors() already approved above.
    crossOriginResourcePolicy: false,
  })
);

app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`🔗 Allowed CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);

// Stricter limit for AI routes to protect Gemini quota
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'AI rate limit reached, please try again later',
});
app.use('/api/ai', aiLimiter);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TalentOS API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

app.use(errorMiddleware);

const server = app.listen(PORT, () => {
  console.log(`🚀 TalentOS Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
