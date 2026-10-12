import { PrismaClient } from '@prisma/client';
import { ResidentProfile, VisitorProfile, DoorEvent, LockStatus } from '@kinddoor/domain';

export const prisma = new PrismaClient();

export async function getPrimaryResident(): Promise<ResidentProfile | null> {
  const resident = await prisma.resident.findFirst({
    include: { accessibility: true }
  });

  if (!resident) return null;

  return {
    id: resident.id,
    name: resident.name,
    preferredName: resident.preferredName || undefined,
    handsFreeEntryEnabled: resident.handsFreeEntryEnabled,
    requiredCredentialTypes: ['BLE_BEACON'],
    trustedDeviceIds: JSON.parse(resident.trustedDeviceIds || '[]'),
    accessibility: resident.accessibility
      ? {
          id: resident.accessibility.id,
          residentId: resident.accessibility.residentId,
          mode: resident.accessibility.mode as any,
          spokenFeedbackEnabled: resident.accessibility.spokenFeedbackEnabled,
          visualAlertsEnabled: resident.accessibility.visualAlertsEnabled,
          highContrast: resident.accessibility.highContrast,
          speechRate: resident.accessibility.speechRate,
          speechPitch: resident.accessibility.speechPitch,
          binaryChoicesOnly: resident.accessibility.binaryChoicesOnly,
          autoReplayIntervalSeconds: resident.accessibility.autoReplayIntervalSeconds,
          largeText: resident.accessibility.largeText
        }
      : {
          id: 'default',
          residentId: resident.id,
          mode: 'STANDARD',
          spokenFeedbackEnabled: true,
          visualAlertsEnabled: true,
          highContrast: false,
          speechRate: 1.0,
          speechPitch: 1.0,
          binaryChoicesOnly: false,
          autoReplayIntervalSeconds: 0,
          largeText: false
        },
    createdAt: resident.createdAt.toISOString(),
    updatedAt: resident.updatedAt.toISOString()
  };
}

export async function getEnrolledVisitors(residentId: string): Promise<VisitorProfile[]> {
  const visitors = await prisma.visitorProfile.findMany({
    where: { residentId }
  });

  return visitors.map((v) => ({
    id: v.id,
    residentId: v.residentId,
    name: v.name,
    relationship: v.relationship as any,
    notes: v.notes || undefined,
    syntheticMatchLabel: v.syntheticMatchLabel || undefined,
    status: v.status as any,
    consentRecordId: v.consentRecordId,
    enrolledAt: v.enrolledAt.toISOString()
  }));
}

export async function findVisitorByName(name: string): Promise<VisitorProfile | null> {
  const visitor = await prisma.visitorProfile.findFirst({
    where: {
      name: {
        contains: name
      }
    }
  });

  if (!visitor) return null;

  return {
    id: visitor.id,
    residentId: visitor.residentId,
    name: visitor.name,
    relationship: visitor.relationship as any,
    notes: visitor.notes || undefined,
    syntheticMatchLabel: visitor.syntheticMatchLabel || undefined,
    status: visitor.status as any,
    consentRecordId: visitor.consentRecordId,
    enrolledAt: visitor.enrolledAt.toISOString()
  };
}

export async function recordDoorEvent(event: Omit<DoorEvent, 'id' | 'timestamp'> & { id?: string }): Promise<DoorEvent> {
  const created = await prisma.doorEvent.create({
    data: {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: event.type,
      source: event.source,
      opticalConfidence: event.opticalConfidence,
      syntheticMatchStatus: event.syntheticMatchStatus,
      rawPayload: event.rawPayload ? JSON.stringify(event.rawPayload) : undefined,
      claimedIdentity: event.claimedIdentity ? JSON.stringify(event.claimedIdentity) : undefined,
      verifiedVisitorId: event.verifiedVisitorId
    }
  });

  return {
    id: created.id,
    type: created.type as any,
    source: created.source as any,
    timestamp: created.timestamp.toISOString(),
    opticalConfidence: created.opticalConfidence as any,
    syntheticMatchStatus: created.syntheticMatchStatus as any,
    rawPayload: created.rawPayload ? JSON.parse(created.rawPayload) : undefined,
    claimedIdentity: created.claimedIdentity ? JSON.parse(created.claimedIdentity) : undefined,
    verifiedVisitorId: created.verifiedVisitorId || undefined
  };
}

export async function getRecentDoorEvents(limit = 10): Promise<DoorEvent[]> {
  const events = await prisma.doorEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit
  });

  return events.map((e) => ({
    id: e.id,
    type: e.type as any,
    source: e.source as any,
    timestamp: e.timestamp.toISOString(),
    opticalConfidence: e.opticalConfidence as any,
    syntheticMatchStatus: e.syntheticMatchStatus as any,
    rawPayload: e.rawPayload ? JSON.parse(e.rawPayload) : undefined,
    claimedIdentity: e.claimedIdentity ? JSON.parse(e.claimedIdentity) : undefined,
    verifiedVisitorId: e.verifiedVisitorId || undefined
  }));
}

export async function logAuditEvent(actor: string, eventType: string, details: Record<string, unknown>, ipOrSource?: string) {
  return prisma.auditEvent.create({
    data: {
      actor,
      eventType,
      details: JSON.stringify(details),
      ipOrSource
    }
  });
}

export * from './seed.js';
