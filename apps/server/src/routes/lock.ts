import { FastifyPluginAsync } from 'fastify';
import { lockAdapterInstance } from '@kinddoor/adapters';
import { logAuditEvent, getPrimaryResident } from '@kinddoor/database';

export const lockRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/lock
  fastify.get('/api/lock', async (request, reply) => {
    const status = await lockAdapterInstance.getState();
    return reply.status(200).send(status);
  });

  // POST /api/lock/lock
  fastify.post('/api/lock/lock', async (request, reply) => {
    const result = await lockAdapterInstance.lock();
    await logAuditEvent('RESIDENT', 'LOCK_MANUALLY_LOCKED', result as unknown as Record<string, unknown>);
    return reply.status(200).send(result);
  });

  // POST /api/lock/jam
  fastify.post('/api/lock/jam', async (request, reply) => {
    const { reason } = (request.body || {}) as any;
    lockAdapterInstance.simulateFailure(reason || 'Bolt obstruction / mechanical jam');
    const status = await lockAdapterInstance.getState();
    await logAuditEvent('SYSTEM_POLICY', 'LOCK_FAILURE_SIMULATED', status as unknown as Record<string, unknown>);
    return reply.status(200).send(status);
  });

  // POST /api/lock/reset
  fastify.post('/api/lock/reset', async (request, reply) => {
    lockAdapterInstance.reset();
    const status = await lockAdapterInstance.getState();
    await logAuditEvent('SYSTEM_POLICY', 'LOCK_RESET', status as unknown as Record<string, unknown>);
    return reply.status(200).send(status);
  });
};
