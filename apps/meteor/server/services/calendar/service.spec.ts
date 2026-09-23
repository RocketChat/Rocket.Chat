import { registerModel } from '@rocket.chat/models';

import { CalendarService } from './service';

const endActiveState = jest.fn();
const setActiveState = jest.fn();
const getSetting = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	api: { broadcast: jest.fn() },
	Presence: {
		endActiveState: (...args: unknown[]) => endActiveState(...args),
		setActiveState: (...args: unknown[]) => setActiveState(...args),
	},
	ServiceClassInternal: class {},
}));

jest.mock('@rocket.chat/cron', () => ({ cronJobs: { add: jest.fn(), remove: jest.fn(), has: jest.fn().mockResolvedValue(false) } }));
jest.mock('../../settings', () => ({ settings: { get: (key: string) => getSetting(key) } }));
jest.mock('../../lib/i18n', () => ({ i18n: { t: (key: string) => key } }));
jest.mock('../../lib/utils/lib/getUserPreference', () => ({ getUserPreference: jest.fn().mockResolvedValue(true) }));

const bulkUpsertImported = jest.fn();
const reopenNotifications = jest.fn();
const deleteUnfinishedByExternalIdsAndUserId = jest.fn();
const deleteImportedOutsideSet = jest.fn();
const findOverlappingEvents = jest.fn();
const findNextNotificationDate = jest.fn();
const findNextFutureEvent = jest.fn();

registerModel('ICalendarEventModel', {
	bulkUpsertImported,
	reopenNotifications,
	deleteUnfinishedByExternalIdsAndUserId,
	deleteImportedOutsideSet,
	findOverlappingEvents,
	findNextNotificationDate,
	findNextFutureEvent,
} as any);

registerModel('IUsersModel', { findOneById: jest.fn().mockResolvedValue({ _id: 'uid' }) } as any);

const cursor = (events: object[]) => ({ toArray: async () => events });

const event = (over: Record<string, unknown> = {}) => ({
	uid: 'uid',
	externalId: 'ext-1',
	subject: 'Standup',
	description: '',
	startTime: new Date('2026-09-07T10:00:00Z'),
	endTime: new Date('2026-09-07T11:00:00Z'),
	busy: true,
	...over,
});

const timeWindow = { start: new Date('2026-09-07T00:00:00Z'), end: new Date('2026-09-09T00:00:00Z') };

describe('CalendarService', () => {
	let service: CalendarService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new CalendarService();
		getSetting.mockReturnValue(true);
		bulkUpsertImported.mockResolvedValue({ upsertedCount: 0, modifiedCount: 0, matchedCount: 0 });
		reopenNotifications.mockResolvedValue({ modifiedCount: 0 });
		deleteUnfinishedByExternalIdsAndUserId.mockResolvedValue({ deletedCount: 0 });
		deleteImportedOutsideSet.mockResolvedValue({ deletedCount: 0 });
		findOverlappingEvents.mockReturnValue(cursor([]));
		findNextNotificationDate.mockResolvedValue(null);
		findNextFutureEvent.mockResolvedValue(null);
	});

	describe('importMany', () => {
		it('skips an event with no externalId, which would be inserted again on every run', async () => {
			const result = await service.importMany([event(), event({ externalId: undefined })], { deferSideEffects: true });

			expect(result.skipped).toBe(1);
			expect(bulkUpsertImported).toHaveBeenCalledWith([expect.objectContaining({ externalId: 'ext-1' })]);
		});

		it('derives the reminder time from the start time and the lead minutes', async () => {
			await service.importMany([event({ reminderMinutesBeforeStart: 15 })], { deferSideEffects: true });

			expect(bulkUpsertImported).toHaveBeenCalledWith([expect.objectContaining({ reminderTime: new Date('2026-09-07T09:45:00Z') })]);
		});

		it('leaves the reminder time unset when the event carries no lead minutes', async () => {
			await service.importMany([event()], { deferSideEffects: true });

			expect(bulkUpsertImported).toHaveBeenCalledWith([expect.objectContaining({ reminderTime: undefined })]);
		});

		it('counts a reopened notification as a modification, so the run reports it as changed', async () => {
			reopenNotifications.mockResolvedValue({ modifiedCount: 2 });

			const result = await service.importMany([event()], { deferSideEffects: true });

			expect(result).toMatchObject({ changed: true, modified: 2 });
		});

		it('reports no change when nothing was written', async () => {
			const result = await service.importMany([event()], { deferSideEffects: true });

			expect(result.changed).toBe(false);
		});

		it('does nothing to presence while side effects are deferred', async () => {
			bulkUpsertImported.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0, matchedCount: 0 });

			await service.importMany([event()], { deferSideEffects: true });

			expect(findOverlappingEvents).not.toHaveBeenCalled();
		});

		it('updates presence when side effects are not deferred', async () => {
			bulkUpsertImported.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0, matchedCount: 0 });

			await service.importMany([event()], { deferSideEffects: false });

			expect(findOverlappingEvents).toHaveBeenCalled();
		});
	});

	describe('deleteImported', () => {
		it('does not query at all for an empty list', async () => {
			const result = await service.deleteImported('uid', [], timeWindow.start, { deferSideEffects: true });

			expect(deleteUnfinishedByExternalIdsAndUserId).not.toHaveBeenCalled();
			expect(result).toMatchObject({ changed: false, deleted: 0 });
		});

		it('passes the floor through, which is what keeps earlier days out of reach', async () => {
			await service.deleteImported('uid', ['ext-1'], timeWindow.start, { deferSideEffects: true });

			expect(deleteUnfinishedByExternalIdsAndUserId).toHaveBeenCalledWith('uid', ['ext-1'], timeWindow.start);
		});

		it('refreshes presence only when something was actually removed', async () => {
			deleteUnfinishedByExternalIdsAndUserId.mockResolvedValue({ deletedCount: 3 });

			await service.deleteImported('uid', ['ext-1'], timeWindow.start, { deferSideEffects: false });

			expect(endActiveState).toHaveBeenCalled();
		});
	});

	describe('pruneImportedWindow', () => {
		it('refreshes presence with the removal gate on once it removed something', async () => {
			deleteImportedOutsideSet.mockResolvedValue({ deletedCount: 1 });

			await service.pruneImportedWindow('uid', timeWindow, []);

			expect(endActiveState).toHaveBeenCalledWith('uid', 'calendar');
		});

		it('touches nothing when it removed nothing', async () => {
			await service.pruneImportedWindow('uid', timeWindow, []);

			expect(endActiveState).not.toHaveBeenCalled();
		});
	});

	describe('refreshBusyPresence', () => {
		it('ends the claim after a removal when nothing is in progress any more', async () => {
			await service.refreshBusyPresence('uid', { removedEvents: true });

			expect(endActiveState).toHaveBeenCalledWith('uid', 'calendar');
		});

		it('sets the claim after an upsert-only pass when an event is in progress', async () => {
			findOverlappingEvents.mockReturnValue(cursor([event()]));

			await service.refreshBusyPresence('uid');

			expect(setActiveState).toHaveBeenCalledWith('uid', expect.objectContaining({ statusDefault: 'busy' }));
		});

		it('expires the claim at the latest end time among the events in progress', async () => {
			findOverlappingEvents.mockReturnValue(
				cursor([event({ endTime: new Date('2026-09-07T11:00:00Z') }), event({ endTime: new Date('2026-09-07T12:30:00Z') })]),
			);

			await service.refreshBusyPresence('uid', { removedEvents: true });

			expect(setActiveState).toHaveBeenCalledWith('uid', expect.objectContaining({ statusExpiresAt: new Date('2026-09-07T12:30:00Z') }));
		});

		it('does nothing at all while busy status is disabled', async () => {
			getSetting.mockReturnValue(false);
			findOverlappingEvents.mockReturnValue(cursor([event()]));

			await service.refreshBusyPresence('uid', { removedEvents: true });

			expect(setActiveState).not.toHaveBeenCalled();
			expect(endActiveState).not.toHaveBeenCalled();
		});
	});
});
