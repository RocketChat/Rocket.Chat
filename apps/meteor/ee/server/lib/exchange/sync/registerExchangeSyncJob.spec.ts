import { configureExchangeSyncJob, DEFAULT_INTERVAL_MINUTES, EXCHANGE_SYNC_JOB, registerExchangeSyncJob } from './registerExchangeSyncJob';

const get = jest.fn();
const has = jest.fn();
const add = jest.fn();
const remove = jest.fn();
const watchMultiple = jest.fn();
const stopWatching = jest.fn();

jest.mock('../../../../../server/settings', () => ({
	settings: { get: (key: string) => get(key), watchMultiple: (...args: unknown[]) => watchMultiple(...args) },
}));
jest.mock('@rocket.chat/cron', () => ({
	cronJobs: {
		has: (...args: unknown[]) => has(...args),
		add: (...args: unknown[]) => add(...args),
		remove: (...args: unknown[]) => remove(...args),
	},
}));
jest.mock('./runExchangeSync', () => ({ runExchangeSync: jest.fn() }));

describe('configureExchangeSyncJob', () => {
	const settingsOf = (over: Record<string, unknown> = {}) => {
		const values: Record<string, unknown> = {
			Outlook_Calendar_Enabled: true,
			Exchange_Mode: 'server',
			Exchange_Calendar_Sync_Interval: 15,
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
		[1, '*/1 * * * *'],
		[15, '*/15 * * * *'],
		[59, '*/59 * * * *'],
	])('schedules every %s minutes as %s', async (minutes, schedule) => {
		settingsOf({ Exchange_Calendar_Sync_Interval: minutes });

		await configureExchangeSyncJob();

		expect(add).toHaveBeenCalledWith(EXCHANGE_SYNC_JOB, schedule, expect.any(Function));
	});

	it.each([
		[60, '0 */1 * * *'],
		[90, '0 */2 * * *'],
		[60 * 48, '0 */23 * * *'],
	])('converts %s minutes into the hour field as %s', async (minutes, schedule) => {
		settingsOf({ Exchange_Calendar_Sync_Interval: minutes });

		await configureExchangeSyncJob();

		expect(add).toHaveBeenCalledWith(EXCHANGE_SYNC_JOB, schedule, expect.any(Function));
	});

	it.each([0, -5, NaN, 0.5, 15.9])('falls back to the default interval for %p', async (minutes) => {
		settingsOf({ Exchange_Calendar_Sync_Interval: minutes });

		await configureExchangeSyncJob();

		expect(add).toHaveBeenCalledWith(EXCHANGE_SYNC_JOB, `*/${DEFAULT_INTERVAL_MINUTES} * * * *`, expect.any(Function));
	});

	it.each([
		['the integration is off', { Outlook_Calendar_Enabled: false }],
		['the mode is legacy', { Exchange_Mode: 'legacy' }],
	])('does not schedule when %s', async (_label, over) => {
		settingsOf(over);

		await configureExchangeSyncJob();

		expect(add).not.toHaveBeenCalled();
	});

	it('removes the existing job before scheduling it again', async () => {
		has.mockResolvedValue(true);

		await configureExchangeSyncJob();

		expect(remove).toHaveBeenCalledWith(EXCHANGE_SYNC_JOB);
		expect(add).toHaveBeenCalledWith(EXCHANGE_SYNC_JOB, expect.anything(), expect.any(Function));
	});
});

describe('registerExchangeSyncJob', () => {
	const flush = () => new Promise((resolve) => setImmediate(resolve));

	beforeEach(() => {
		jest.clearAllMocks();
		has.mockResolvedValue(false);
		add.mockResolvedValue(undefined);
		remove.mockResolvedValue(undefined);
		watchMultiple.mockReturnValue(stopWatching);
		get.mockImplementation((key: string) => ({ Outlook_Calendar_Enabled: true, Exchange_Mode: 'server' })[key]);
	});

	it('watches the settings that decide whether the job exists at all', () => {
		registerExchangeSyncJob();

		expect(watchMultiple).toHaveBeenCalledWith(
			['Outlook_Calendar_Enabled', 'Exchange_Mode', 'Exchange_Calendar_Sync_Interval'],
			expect.any(Function),
		);
	});

	it('reconfigures the job when a watched setting changes', async () => {
		registerExchangeSyncJob();

		await watchMultiple.mock.calls[0][1]();
		await flush();

		expect(add).toHaveBeenCalled();
	});
});
