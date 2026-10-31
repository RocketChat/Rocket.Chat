import { configureCalendarSyncJob, CALENDAR_SYNC_JOB, registerCalendarSyncJob } from './registerCalendarSyncJob';
import { DEFAULT_INTERVAL_HOURS } from '../../../../../lib/exchange/calendarSyncSchedule';

const get = jest.fn();
const has = jest.fn();
const add = jest.fn();
const remove = jest.fn();
const watchMultiple = jest.fn();
const stopWatching = jest.fn();
const discardImportedBySource = jest.fn();
const removeAll = jest.fn();
const whenMailboxesIdle = jest.fn();
const findAllUserIds = jest.fn();

jest.mock('../../../../../../server/settings', () => ({
	settings: { get: (key: string) => get(key), watchMultiple: (...args: unknown[]) => watchMultiple(...args) },
}));
jest.mock('@rocket.chat/cron', () => ({
	cronJobs: {
		has: (...args: unknown[]) => has(...args),
		add: (...args: unknown[]) => add(...args),
		remove: (...args: unknown[]) => remove(...args),
	},
}));
jest.mock('./runCalendarSync', () => ({ runCalendarSync: jest.fn() }));
jest.mock('./mailboxLock', () => ({ whenMailboxesIdle: () => whenMailboxesIdle() }));
jest.mock('@rocket.chat/core-services', () => ({
	Calendar: { discardImportedBySource: (...args: unknown[]) => discardImportedBySource(...args) },
}));
jest.mock('@rocket.chat/models', () => ({
	ExchangeCalendarSyncState: { findAllUserIds: () => findAllUserIds(), removeAll: () => removeAll() },
}));

describe('configureCalendarSyncJob', () => {
	const settingsOf = (over: Record<string, unknown> = {}) => {
		const values: Record<string, unknown> = {
			Outlook_Calendar_Enabled: true,
			Exchange_Mode: 'server',
			Exchange_Calendar_Sync_Interval: 1,
			...over,
		};
		get.mockImplementation((key: string) => values[key]);
	};

	beforeEach(() => {
		jest.clearAllMocks();
		has.mockResolvedValue(false);
		add.mockResolvedValue(undefined);
		remove.mockResolvedValue(undefined);
		settingsOf();
	});

	it.each([
		[1, '0 */1 * * *'],
		[3, '0 */3 * * *'],
		[12, '0 */12 * * *'],
		[24, '0 0 * * *'],
	])('schedules every %s hours as %s', async (hours, schedule) => {
		settingsOf({ Exchange_Calendar_Sync_Interval: hours });

		await configureCalendarSyncJob();

		expect(add).toHaveBeenCalledWith(CALENDAR_SYNC_JOB, schedule, expect.any(Function));
	});

	it.each([
		[5, '0 */4 * * *'],
		[7, '0 */6 * * *'],
		[23, '0 */12 * * *'],
		[48, '0 0 * * *'],
	])('rounds %s hours down to %s rather than scheduling an uneven cadence', async (hours, schedule) => {
		settingsOf({ Exchange_Calendar_Sync_Interval: hours });

		await configureCalendarSyncJob();

		expect(add).toHaveBeenCalledWith(CALENDAR_SYNC_JOB, schedule, expect.any(Function));
	});

	it.each([0, -5, NaN, 0.5])('falls back to the default interval for %p', async (hours) => {
		settingsOf({ Exchange_Calendar_Sync_Interval: hours });

		await configureCalendarSyncJob();

		expect(add).toHaveBeenCalledWith(CALENDAR_SYNC_JOB, `0 */${DEFAULT_INTERVAL_HOURS} * * *`, expect.any(Function));
	});

	it.each([
		['the integration is off', { Outlook_Calendar_Enabled: false }],
		['the mode is legacy', { Exchange_Mode: 'legacy' }],
	])('does not schedule when %s', async (_label, over) => {
		settingsOf(over);

		await configureCalendarSyncJob();

		expect(add).not.toHaveBeenCalled();
	});

	it('removes the existing job before scheduling it again', async () => {
		has.mockResolvedValue(true);

		await configureCalendarSyncJob();

		expect(remove).toHaveBeenCalledWith(CALENDAR_SYNC_JOB);
		expect(add).toHaveBeenCalledWith(CALENDAR_SYNC_JOB, expect.anything(), expect.any(Function));
	});
});

describe('registerCalendarSyncJob', () => {
	const flush = () => new Promise((resolve) => setImmediate(resolve));

	beforeEach(() => {
		jest.clearAllMocks();
		has.mockResolvedValue(false);
		add.mockResolvedValue(undefined);
		remove.mockResolvedValue(undefined);
		watchMultiple.mockReturnValue(stopWatching);
		discardImportedBySource.mockResolvedValue(0);
		removeAll.mockResolvedValue(undefined);
		whenMailboxesIdle.mockResolvedValue(undefined);
		findAllUserIds.mockResolvedValue([]);
		get.mockImplementation((key: string) => ({ Outlook_Calendar_Enabled: true, Exchange_Mode: 'server' })[key]);
	});

	it('watches the settings that decide whether the job exists at all', () => {
		registerCalendarSyncJob();

		expect(watchMultiple).toHaveBeenCalledWith(
			['Outlook_Calendar_Enabled', 'Exchange_Mode', 'Exchange_Calendar_Sync_Interval'],
			expect.any(Function),
		);
	});

	it('reconfigures the job when a watched setting changes', async () => {
		registerCalendarSyncJob();

		await watchMultiple.mock.calls[0][1]();
		await flush();

		expect(add).toHaveBeenCalled();
	});

	it('does not re-add the job when the cleanup lands while a reconfiguration is in flight', async () => {
		let resume: (exists: boolean) => void = () => undefined;
		has.mockImplementationOnce(
			() =>
				new Promise<boolean>((resolve) => {
					resume = resolve;
				}),
		);

		const unregister = registerCalendarSyncJob();
		watchMultiple.mock.calls[0][1]();

		unregister();
		resume(false);
		await flush();

		expect(add).not.toHaveBeenCalled();
	});

	it('discards what the sync imported, and the cursors with it, when it is switched off', async () => {
		registerCalendarSyncJob();

		await watchMultiple.mock.calls[0][1]();
		await flush();

		get.mockImplementation((key: string) => ({ Outlook_Calendar_Enabled: true, Exchange_Mode: 'legacy' })[key]);

		await watchMultiple.mock.calls[0][1]();
		await flush();

		expect(discardImportedBySource).toHaveBeenCalledWith('outlook', []);
		expect(removeAll).toHaveBeenCalled();
	});

	it('refreshes the presence of every mailbox the sync had touched', async () => {
		findAllUserIds.mockResolvedValue(['u1', 'u2']);
		removeAll.mockImplementation(async () => findAllUserIds.mockResolvedValue([]));

		registerCalendarSyncJob();
		const notify = watchMultiple.mock.calls[0][1];

		await notify();
		await flush();

		get.mockImplementation((key: string) => ({ Outlook_Calendar_Enabled: true, Exchange_Mode: 'legacy' })[key]);

		await notify();
		await flush();

		expect(discardImportedBySource).toHaveBeenCalledWith('outlook', ['u1', 'u2']);
	});

	it('leaves the imported events alone when the cursors cannot be cleared', async () => {
		registerCalendarSyncJob();
		const notify = watchMultiple.mock.calls[0][1];

		await notify();
		await flush();

		removeAll.mockRejectedValueOnce(new Error('mongo is down'));

		get.mockImplementation((key: string) => ({ Outlook_Calendar_Enabled: true, Exchange_Mode: 'legacy' })[key]);

		await notify();
		await flush();

		expect(discardImportedBySource).not.toHaveBeenCalled();
	});

	it('stops watching and drops the job when the returned cleanup runs', async () => {
		has.mockResolvedValue(true);

		registerCalendarSyncJob()();
		await flush();

		expect(stopWatching).toHaveBeenCalled();
		expect(remove).toHaveBeenCalledWith(CALENDAR_SYNC_JOB);
	});
});
