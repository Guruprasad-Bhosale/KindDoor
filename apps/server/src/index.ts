import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { ServerEnvSchema } from '@kinddoor/validation';
import { ringRoutes } from './routes/ring.js';
import { assistantRoutes } from './routes/assistant.js';
import { residentRoutes } from './routes/resident.js';
import { lockRoutes } from './routes/lock.js';
import { mcpRoutes } from './routes/mcp.js';
import { getRecentDoorEvents, prisma, seedDatabase, logAuditEvent } from '@kinddoor/database';

dotenv.config();

// 1. Strict Environment Validation at Startup
const envResult = ServerEnvSchema.safeParse(process.env);
if (!envResult.success) {
  console.error('FATAL: Environment configuration validation failed:');
  console.error(JSON.stringify(envResult.error.format(), null, 2));
  process.exit(1);
}

const env = envResult.data;
const port = typeof env.PORT === 'string' ? parseInt(env.PORT, 10) : env.PORT;
const host = env.HOST;

async function bootstrap() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'warn' : 'info'
    },
    bodyLimit: 1048576 // 1MB max payload to prevent memory exhaustion
  });

  // 2. Strict Security Headers Hook
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
    reply.header('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");
  });

  // 3. Strict CORS Configuration
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, MCP clients, server-to-server)
      if (!origin) return cb(null, true);
      if (origin === env.CORS_ORIGIN || origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000') {
        return cb(null, true);
      }
      cb(new Error('CORS Not Allowed by KindDoor Security Policy'), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false // Disallow wildcard credentials
  });

  // 4. In-Memory Sliding Window Rate Limiting (Cost & Abuse Control)
  const requestCounts = new Map<string, { count: number; windowStart: number }>();
  fastify.addHook('preHandler', async (request, reply) => {
    // Only rate-limit mutative assistant and simulator routes
    if (request.url.startsWith('/api/assistant') || request.url.startsWith('/api/simulator/trigger')) {
      const ip = request.ip || '127.0.0.1';
      const now = Date.now();
      const userLimiter = requestCounts.get(ip) || { count: 0, windowStart: now };

      if (now - userLimiter.windowStart > 60000) {
        userLimiter.count = 0;
        userLimiter.windowStart = now;
      }

      userLimiter.count++;
      requestCounts.set(ip, userLimiter);

      if (userLimiter.count > 60) {
        // Max 60 requests/min per IP
        return reply.status(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded for assistant/simulator interaction. Please wait a moment.',
          retryAfterSeconds: 60
        });
      }
    }
  });

  // 5. Global Production Error Masking (No Leakage of Stack Traces or Internal Paths)
  fastify.setErrorHandler((error: any, request, reply) => {
    fastify.log.error(error);
    const isProd = env.NODE_ENV === 'production';

    if (error.validation) {
      return reply.status(400).send({
        error: 'Bad Request',
        code: 'VALIDATION_ERROR',
        message: 'Request payload validation failed.',
        details: isProd ? undefined : error.validation
      });
    }

    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : error.name || 'Error',
      code: error.code || 'SERVER_ERROR',
      message: isProd && statusCode >= 500 ? 'An unexpected server error occurred.' : error.message || 'An error occurred',
      timestamp: new Date().toISOString()
    });
  });

  // 6. Health & Diagnostic Check
  fastify.get('/health', async () => {
    return {
      status: 'HEALTHY',
      service: 'kinddoor-backend-server',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      mcp: 'ENABLED_STREAMABLE_HTTP',
      bedrock: env.AWS_ACCESS_KEY_ID ? 'CONFIGURED' : 'FALLBACK_READY',
      gemini: env.GEMINI_API_KEY ? 'CONFIGURED' : 'FALLBACK_READY',
      ring: 'INTEGRATED_SIMULATOR_ACTIVE'
    };
  });

  // 7. Events & Audit History
  fastify.get('/api/events', async () => {
    const recentEvents = await getRecentDoorEvents(20);
    const auditLogs = await prisma.auditEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    return {
      events: recentEvents,
      auditLogs: auditLogs.map((a) => ({
        ...a,
        details: JSON.parse(a.details || '{}')
      }))
    };
  });

  // 8. Privacy & Data Retention: Purge Expired Visit Interactions
  fastify.post('/api/events/purge-expired', async (request, reply) => {
    const now = new Date();
    const deleted = await prisma.visitInteraction.deleteMany({
      where: {
        retentionDeadline: {
          lt: now
        }
      }
    });

    await logAuditEvent('SYSTEM_POLICY', 'EXPIRED_VISIT_RECORDS_PURGED', {
      recordsPurged: deleted.count,
      purgedAt: now.toISOString()
    });

    return reply.status(200).send({
      success: true,
      recordsPurged: deleted.count,
      message: `Privacy retention purge completed. ${deleted.count} expired records removed.`
    });
  });

  // Register Route Plugins
  await fastify.register(ringRoutes);
  await fastify.register(assistantRoutes);
  await fastify.register(residentRoutes);
  await fastify.register(lockRoutes);
  await fastify.register(mcpRoutes);

  // Auto-seed database if empty
  try {
    const count = await prisma.resident.count();
    if (count === 0) {
      console.log('Database unseeded. Running initial seed...');
      await seedDatabase();
    }
  } catch (err) {
    console.warn('Database initialization note:', err);
  }

  try {
    await fastify.listen({ port, host });
    console.log(`====================================================`);
    console.log(`  KindDoor Secure Backend running on port ${port}`);
    console.log(`  - Environment: ${env.NODE_ENV}`);
    console.log(`  - MCP Protocol: Streamable HTTP (:4000/mcp)`);
    console.log(`  - Bedrock Mode: ${env.AWS_ACCESS_KEY_ID ? 'AWS Bedrock Converse API' : 'Deterministic Fallback'}`);
    console.log(`  - Health Check: http://localhost:${port}/health`);
    console.log(`====================================================`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
