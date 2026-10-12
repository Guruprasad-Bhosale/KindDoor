import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('Seeding KindDoor database with synthetic resident and visitor data...');

  // 1. Clean existing records
  await prisma.auditEvent.deleteMany();
  await prisma.accessDecision.deleteMany();
  await prisma.visitInteraction.deleteMany();
  await prisma.doorEvent.deleteMany();
  await prisma.visitorProfile.deleteMany();
  await prisma.accessibilityPreferences.deleteMany();
  await prisma.resident.deleteMany();

  // 2. Create Primary Resident: Eleanor Vance
  const eleanor = await prisma.resident.create({
    data: {
      id: 'res-eleanor-001',
      name: 'Eleanor Vance',
      preferredName: 'Eleanor',
      handsFreeEntryEnabled: true,
      trustedDeviceIds: JSON.stringify(['phone-eleanor-iphone15', 'watch-eleanor-series9', 'ble-tag-groceries']),
      accessibility: {
        create: {
          id: 'acc-eleanor-001',
          mode: 'STANDARD',
          spokenFeedbackEnabled: true,
          visualAlertsEnabled: true,
          highContrast: false,
          speechRate: 1.0,
          speechPitch: 1.0,
          binaryChoicesOnly: false,
          autoReplayIntervalSeconds: 0,
          largeText: false
        }
      }
    }
  });

  // 3. Create Enrolled Regular Visitors
  // Maya: Neighbor
  await prisma.visitorProfile.create({
    data: {
      id: 'vis-maya-001',
      residentId: eleanor.id,
      name: 'Maya Lin',
      relationship: 'NEIGHBOR',
      notes: 'Next-door neighbor; frequently exchanges gardening tools',
      syntheticMatchLabel: 'likely_match_maya',
      status: 'ENROLLED_REGULAR',
      consentRecordId: 'consent-eleanor-maya-2026'
    }
  });

  // Mark: Caregiver / Son
  await prisma.visitorProfile.create({
    data: {
      id: 'vis-mark-002',
      residentId: eleanor.id,
      name: 'Mark Vance',
      relationship: 'FAMILY',
      notes: 'Eleanor son; visits Tuesdays and weekends',
      syntheticMatchLabel: 'likely_match_mark',
      status: 'ENROLLED_REGULAR',
      consentRecordId: 'consent-eleanor-mark-2026'
    }
  });

  // 4. Create Initial Seed Door Events
  const sampleEvent = await prisma.doorEvent.create({
    data: {
      id: 'evt-init-001',
      type: 'DING',
      source: 'SIMULATOR',
      opticalConfidence: 'CLEAR_HUMAN',
      syntheticMatchStatus: 'LIKELY_MATCH',
      rawPayload: JSON.stringify({ kind: 'ding', device_id: 'ring-doorbell-front-01' })
    }
  });

  await prisma.auditEvent.create({
    data: {
      eventType: 'WEBHOOK_RECEIVED',
      actor: 'SYSTEM_POLICY',
      details: JSON.stringify({ message: 'KindDoor database initialized and seeded successfully' })
    }
  });

  console.log('Database seeded successfully! Eleanor Vance and regular profiles ready.');
}

if (process.env.NODE_ENV !== 'test' && !process.env.SKIP_SEED_EXEC) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
