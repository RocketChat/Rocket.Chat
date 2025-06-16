import { UserStatus, type ICalendarEvent } from '@rocket.chat/core-typings';
import type { AgendaCronJobs } from '@rocket.chat/cron';
import type { ICalendarEventModel } from '@rocket.chat/model-typings';

import { CalendarService } from './service';
import type { CachedSettings } from '../../../app/settings/server/CachedSettings';

const settings = new Map<string, unknown>();

jest.mock('../../../app/settings/server', () => ({
	settings: {
		get(_id) {
			return settings.get(_id) as any;
		},
	} satisfies Partial<CachedSettings>,
}));

const jobs = new Map<string, { when?: Date; schedule?: string; callback: () => any | Promise<any> }>();

const runJobs = async () => {
	for (const [name, job] of jobs.entries()) {
		if (job.when) {
			if (job.when <= new Date()) {
				void job.callback();
				jobs.delete(name);
			}
		} else if (job.schedule) {
			// For simplicity, we assume the schedule is a valid cron expression and run it immediately
			void job.callback();
			jobs.delete(name);
		}
	}
};

jest.mock('@rocket.chat/cron', () => ({
	cronJobs: {
		has(name: string) {
			return Promise.resolve(jobs.has(name));
		},
		addAtTimestamp(name, when, callback) {
			jobs.set(name, { when, callback });
			return Promise.resolve();
		},
		add(name, schedule, callback) {
			jobs.set(name, { schedule, callback });
			return Promise.resolve();
		},
		remove(name) {
			jobs.delete(name);
			return Promise.resolve();
		},
	} satisfies Partial<AgendaCronJobs>,
}));

const events = new Map<string, ICalendarEvent>();

jest.mock('@rocket.chat/models', () => ({
	CalendarEvent: {
		insertOne(doc, _options) {
			const id = `test-id-${events.size + 1}`;
			events.set(id, {
				_id: id,
				_updatedAt: new Date(),
				...doc,
			});
			return Promise.resolve({ insertedId: id, acknowledged: true });
		},
		findNextNotificationDate() {
			const now = new Date();
			const futureEvents = Array.from(events.values()).filter((event) => event.startTime > now);
			return Promise.resolve(futureEvents.length > 0 ? futureEvents[0].startTime : null);
		},
		findEventsToNotify(notificationTime, minutes) {
			// Find all the events between notificationTime and +minutes that have not been notified yet
			const maxDate = new Date(notificationTime.toISOString());
			maxDate.setMinutes(maxDate.getMinutes() + minutes);

			return events
				.values()
				.filter(
					(event) =>
						event.reminderTime && event.reminderTime >= notificationTime && event.reminderTime < maxDate && !event.notificationSent,
				) as any;
		},
		findNextFutureEvent(startTime) {
			const futureEvents = Array.from(events.values()).filter((event) => event.startTime > startTime);
			return Promise.resolve(futureEvents.length > 0 ? futureEvents[0] : null);
		},
		findInProgressEvents(now) {
			return events.values().filter((event) => event.startTime <= now && (!event.endTime || event.endTime > now)) as any; // Mocking FindCursor
		},
		findOneByExternalIdAndUserId(externalId, uid) {
			return Promise.resolve(Array.from(events.values()).find((event) => event.externalId === externalId && event.uid === uid) || null);
		},
		findEventsStartingNow({ now, offset }) {
			const startTime = new Date(now.getTime() + (offset ?? 0));
			const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
			return events.values().filter((event) => event.startTime >= startTime && event.startTime < endTime) as any; // Mocking FindCursor
		},
		findEventsEndingNow({ now, offset }) {
			const startTime = new Date(now.getTime() + (offset ?? 0));
			const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
			return events.values().filter((event) => event.endTime && event.endTime >= startTime && event.endTime < endTime) as any; // Mocking FindCursor
		},
	} satisfies Partial<ICalendarEventModel>,
}));

describe('CalendarService', () => {
	let service: CalendarService;

	beforeEach(() => {
		const now = new Date(2025, 5, 12, 22, 28, 24); // June 12, 2025
		jest.useFakeTimers({
			now,
		});
		service = new CalendarService();
		settings.clear();
		events.clear();
		jobs.clear();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should return a calendar event by ID', async () => {
		const event = await service.create({
			startTime: new Date(),
			uid: 'test-uid',
			subject: 'Test Event',
			description: 'This is a test event',
		});
		expect(event).toBe('test-id-1');
	});

	it('should register busy time for a user', async () => {
		settings.set('Calendar_BusyStatus_Enabled', true);
		const startTime = new Date();
		const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
		const event = await service.create({
			startTime,
			endTime,
			uid: 'test-uid',
			subject: 'Test Event',
			description: 'This is a test event',
			busy: true,
			externalId: 'external-id-123',
		});
		expect(event).toBe(events.get(event)?._id);
		expect(jobs.entries().toArray()).toMatchInlineSnapshot(`
		[
		  [
		    "calendar-status-scheduler",
		    {
		      "callback": [Function],
		      "when": 2025-06-13T02:28:24.000Z,
		    },
		  ],
		]
	`);
	});

	it('should register busy time for a user with import', async () => {
		settings.set('Calendar_BusyStatus_Enabled', true);
		const startTime = new Date();
		const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
		const event = await service.import({
			startTime,
			endTime,
			uid: 'test-uid',
			subject: 'Test Event',
			description: 'This is a test event',
			busy: true,
			externalId: 'external-id-123',
			previousStatus: UserStatus.ONLINE,
		});
		expect(event).toBe(events.get(event)?._id);
		expect(jobs.entries().toArray()).toMatchInlineSnapshot(`
		[
		  [
		    "calendar-status-scheduler",
		    {
		      "callback": [Function],
		      "when": 2025-06-13T02:28:24.000Z,
		    },
		  ],
		]
	`);
	});

	it('should not register busy time if Calendar_BusyStatus_Enabled is false', async () => {
		settings.set('Calendar_BusyStatus_Enabled', false);
		const startTime = new Date();
		const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
		const event = await service.create({
			startTime,
			endTime,
			uid: 'test-uid',
			subject: 'Test Event',
			description: 'This is a test event',
			busy: true,
			externalId: 'external-id-123',
		});
		expect(event).toBe(events.get(event)?._id);
		expect(jobs.size).toBe(0);
	});

	it('should revert busy status for a user after the event ends', async () => {
		settings.set('Calendar_BusyStatus_Enabled', true);
		const startTime = new Date();
		const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
		const event = await service.create({
			startTime,
			endTime,
			uid: 'test-uid',
			subject: 'Test Event',
			description: 'This is a test event',
			busy: true,
			externalId: 'external-id-123',
		});
		expect(event).toBe(events.get(event)?._id);

		expect(jobs).toMatchInlineSnapshot(`
		Map {
		  "calendar-status-scheduler" => {
		    "callback": [Function],
		    "when": 2025-06-13T02:28:24.000Z,
		  },
		}
	`);

		jest.advanceTimersByTime(3600000); // Fast-forward time by 1 hour
		await runJobs();

		expect(jobs.size).toBe(0);
	});
});
