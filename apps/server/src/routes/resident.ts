import { FastifyPluginAsync } from 'fastify';
import { getPrimaryResident, prisma, logAuditEvent } from '@kinddoor/database';

export const residentRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/resident
  fastify.get('/api/resident', async (request, reply) => {
    const resident = await getPrimaryResident();
    if (!resident) {
      return reply.status(404).send({ error: 'No resident profile found' });
    }
    return reply.status(200).send(resident);
  });

  // PATCH /api/resident/accessibility
  fastify.patch('/api/resident/accessibility', async (request, reply) => {
    const updates = (request.body || {}) as any;
    const resident = await getPrimaryResident();
    if (!resident) {
      return reply.status(404).send({ error: 'Resident not found' });
    }

    const updated = await prisma.accessibilityPreferences.update({
      where: { residentId: resident.id },
      data: {
        mode: updates.mode,
        spokenFeedbackEnabled: updates.spokenFeedbackEnabled,
        visualAlertsEnabled: updates.visualAlertsEnabled,
        highContrast: updates.highContrast,
        speechRate: updates.speechRate,
        speechPitch: updates.speechPitch,
        binaryChoicesOnly: updates.binaryChoicesOnly,
        largeText: updates.largeText
      }
    });

    if (typeof updates.handsFreeEntryEnabled === 'boolean') {
      await prisma.resident.update({
        where: { id: resident.id },
        data: { handsFreeEntryEnabled: updates.handsFreeEntryEnabled }
      });
    }

    await logAuditEvent('RESIDENT', 'ACCESSIBILITY_PREFERENCES_UPDATED', {
      residentId: resident.id,
      mode: updates.mode
    });

    const refreshed = await getPrimaryResident();
    return reply.status(200).send(refreshed);
  });

  // GET /api/resident/visitors
  fastify.get('/api/resident/visitors', async (request, reply) => {
    const resident = await getPrimaryResident();
    if (!resident) {
      return reply.status(404).send({ error: 'Resident not found' });
    }
    const visitors = await prisma.visitorProfile.findMany({
      where: { residentId: resident.id }
    });
    return reply.status(200).send(visitors);
  });

  // DELETE /api/resident/visitors/:id - Resident-Controlled Profile Revocation
  fastify.delete('/api/resident/visitors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resident = await getPrimaryResident();
    if (!resident) {
      return reply.status(404).send({ error: 'Resident not found' });
    }

    const existing = await prisma.visitorProfile.findUnique({
      where: { id }
    });

    if (!existing || existing.residentId !== resident.id) {
      return reply.status(404).send({ error: 'Visitor profile not found or not owned by resident' });
    }

    await prisma.visitorProfile.delete({
      where: { id }
    });

    await logAuditEvent('RESIDENT', 'VISITOR_PROFILE_REVOKED', {
      visitorId: id,
      visitorName: existing.name,
      residentId: resident.id
    });

    return reply.status(200).send({
      success: true,
      message: `Visitor profile for ${existing.name} has been revoked and removed.`
    });
  });
};
