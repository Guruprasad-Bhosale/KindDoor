import { describe, it, expect, beforeAll } from 'vitest';
import {
  getPrimaryResident,
  getEnrolledVisitors,
  findVisitorByName,
  recordDoorEvent,
  getRecentDoorEvents,
  prisma,
  seedDatabase
} from '../src/index.js';

describe('Database Repositories & Access Layer', () => {
  beforeAll(async () => {
    process.env.SKIP_SEED_EXEC = 'true';
    await seedDatabase();
  });

  it('retrieves the primary resident profile', async () => {
    const resident = await getPrimaryResident();
    expect(resident).toBeDefined();
    expect(resident?.name).toBe('Eleanor Vance');
    expect(resident?.accessibility).toBeDefined();
  });

  it('retrieves enrolled regular visitors', async () => {
    const resident = await getPrimaryResident();
    if (!resident) throw new Error('No resident');

    const visitors = await getEnrolledVisitors(resident.id);
    expect(visitors.length).toBeGreaterThanOrEqual(2);

    const maya = await findVisitorByName('Maya');
    expect(maya).toBeDefined();
    expect(maya?.relationship).toBe('NEIGHBOR');
  });

  it('records and queries door events', async () => {
    const event = await recordDoorEvent({
      type: 'DING',
      source: 'SIMULATOR',
      opticalConfidence: 'CLEAR_HUMAN'
    });

    expect(event.id).toBeDefined();
    expect(event.type).toBe('DING');

    const recent = await getRecentDoorEvents(5);
    expect(recent.some((e) => e.id === event.id)).toBe(true);
  });
});
