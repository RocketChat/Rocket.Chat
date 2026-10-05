import { configureContactSyncJob, CONTACT_SYNC_JOB } from './registerContactSyncJob';

const get = jest.fn();
const has = jest.fn();
const add = jest.fn();
const remove = jest.fn();
const watchMultiple = jest.fn();
const stopWatching = jest.fn();
const runContactSync = jest.fn();

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
jest.mock('./runContactSync', () => ({ runContactSync: (...args: unknown[]) => runContactSync(...args) }));

const settingsOf = (over: Record<string, unknown> = {}) => {
	const values: Record<string, unknown> = {
		Outlook_Calendar_Enabled: true,
		Exchange_Mode: 'server',
		Exchange_Contacts_Sync_Enabled: true,
		...over,
	};
	get.mockImplementation((key: string) => values[key]);
};

describe('configureContactSyncJob', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		has.mockResolvedValue(false);
		add.mockResolvedValue(undefined);
		remove.mockResolvedValue(undefined);
		watchMultiple.mockReturnValue(stopWatching);
		runContactSync.mockResolvedValue(undefined);
		settingsOf();
	});

	describe('scheduling', () => {
		it('runs the contact sync when the job fires', async () => {
			await configureContactSyncJob();

			await add.mock.calls[0][2]();

			expect(runContactSync).toHaveBeenCalled();
		});

		it('removes the job it already had, so a settings change does not stack two of them', async () => {
			has.mockResolvedValue(true);

			await configureContactSyncJob();

			expect(remove).toHaveBeenCalledWith(CONTACT_SYNC_JOB);
			expect(remove.mock.invocationCallOrder[0]).toBeLessThan(add.mock.invocationCallOrder[0]);
		});

		it('does not reach for a job that was never scheduled', async () => {
			await configureContactSyncJob();

			expect(remove).not.toHaveBeenCalled();
		});
	});

	describe('what has to be on for it to be scheduled', () => {
		it.each([
			['the feature is off', { Outlook_Calendar_Enabled: false }],
			['the server does not own the sync', { Exchange_Mode: 'legacy' }],
			['contact sync is off on its own', { Exchange_Contacts_Sync_Enabled: false }],
		])('schedules nothing while %s', async (_case, over) => {
			settingsOf(over);

			await configureContactSyncJob();

			expect(add).not.toHaveBeenCalled();
		});

		it('takes the running job down when the setting that justified it is turned off', async () => {
			settingsOf({ Exchange_Contacts_Sync_Enabled: false });
			has.mockResolvedValue(true);

			await configureContactSyncJob();

			expect(remove).toHaveBeenCalledWith(CONTACT_SYNC_JOB);
			expect(add).not.toHaveBeenCalled();
		});
	});
});
