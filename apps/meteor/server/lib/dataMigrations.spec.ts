import type { IDataMigrationRecord } from '@rocket.chat/core-typings';

const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockAcquireLock = jest.fn();
const mockReleaseLock = jest.fn();
const mockShowErrorBox = jest.fn();
const mockShowWarningBox = jest.fn();

const mockInfoObj = {
	version: '8.3.0',
	commit: { hash: 'abc123', date: '', branch: '', tag: '' },
	build: { date: new Date().toISOString() },
};

jest.mock('@rocket.chat/models', () => ({
	DataMigrations: {
		find: (...args: any[]) => mockFind(...args),
		findOne: (...args: any[]) => mockFindOne(...args),
		updateOne: (...args: any[]) => mockUpdateOne(...args),
	},
	SystemLocks: {
		acquireLock: (...args: any[]) => mockAcquireLock(...args),
		releaseLock: (...args: any[]) => mockReleaseLock(...args),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		startup: jest.fn(),
	})),
}));

jest.mock('./logger/showBox', () => ({
	showErrorBox: (...args: any[]) => mockShowErrorBox(...args),
	showWarningBox: (...args: any[]) => mockShowWarningBox(...args),
}));

jest.mock('../../app/utils/rocketchat.info', () => ({
	get Info() {
		return mockInfoObj;
	},
}));

jest.mock('../../lib/utils/sleep', () => ({
	sleep: jest.fn().mockResolvedValue(undefined),
}));

function createMigration(
	overrides: Partial<{
		id: string;
		description: string;
		strategy: 'once' | 'every-upgrade';
		order: number;
		direction: 'upgrade' | 'downgrade' | 'both';
		fatal: boolean;
		requiresManualReversion: boolean;
		manualReversionInstructions: string;
		run: () => Promise<void> | void;
	}> = {},
) {
	return {
		id: overrides.id ?? 'test-migration',
		description: overrides.description ?? 'Test migration',
		strategy: overrides.strategy ?? ('once' as const),
		order: overrides.order ?? 1,
		direction: overrides.direction ?? ('upgrade' as const),
		requiresManualReversion: overrides.requiresManualReversion ?? (false as const),
		fatal: overrides.fatal,
		run: 'run' in overrides ? overrides.run : jest.fn(),
		...(overrides.requiresManualReversion === true && {
			manualReversionInstructions: overrides.manualReversionInstructions ?? 'Revert manually',
		}),
	} as any;
}

function createRecord(overrides: Partial<IDataMigrationRecord> = {}): IDataMigrationRecord {
	return {
		_id: overrides._id ?? '00001_test-migration',
		status: overrides.status ?? 'completed',
		lastRunAt: overrides.lastRunAt ?? new Date(),
		lastRunHash: overrides.lastRunHash ?? 'abc123',
		runCount: overrides.runCount ?? 1,
		order: overrides.order ?? 1,
		requiresManualReversion: overrides.requiresManualReversion ?? false,
		...overrides,
	};
}

describe('Data Migrations', () => {
	let addDataMigration: typeof import('./dataMigrations').addDataMigration;
	let runDataMigrations: typeof import('./dataMigrations').runDataMigrations;
	let processExitSpy: jest.SpyInstance;

	beforeEach(async () => {
		jest.clearAllMocks();

		// Re-import to reset the module-level `dataMigrations` Set
		jest.resetModules();
		const mod = await import('./dataMigrations');
		addDataMigration = mod.addDataMigration;
		runDataMigrations = mod.runDataMigrations;

		mockInfoObj.version = '8.3.0';
		mockInfoObj.commit.hash = 'abc123';

		mockAcquireLock.mockResolvedValue({
			acquired: true,
			record: { _id: 'data_migrations', locked: true, extraData: { lastVersion: '8.3.0' } },
		});
		mockReleaseLock.mockResolvedValue(undefined);
		mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
		mockFindOne.mockResolvedValue(null);

		processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
	});

	afterEach(() => {
		processExitSpy.mockRestore();
	});

	describe('addDataMigration', () => {
		it('should throw if id is missing', () => {
			expect(() => addDataMigration(createMigration({ id: '' }))).toThrow('Data migration id is required');
		});

		it('should throw if description is missing', () => {
			expect(() => addDataMigration(createMigration({ description: '' }))).toThrow('Data migration description is required');
		});

		it('should throw if run is missing', () => {
			expect(() => addDataMigration(createMigration({ run: undefined as any }))).toThrow('Data migration run() is required');
		});

		it('should register a valid migration without throwing', () => {
			expect(() => addDataMigration(createMigration({ id: 'valid-add-test', order: 9990 }))).not.toThrow();
		});
	});

	describe('runDataMigrations', () => {
		it('should skip if commit hash is not available', async () => {
			mockInfoObj.commit.hash = '';
			addDataMigration(createMigration({ id: 'skip-no-hash', order: 9991 }));

			await runDataMigrations();

			expect(mockAcquireLock).not.toHaveBeenCalled();
		});

		it('should not run if there are no migrations registered', async () => {
			await runDataMigrations();

			expect(mockAcquireLock).not.toHaveBeenCalled();
		});

		it('should acquire and release lock', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

			addDataMigration(createMigration({ id: 'lock-test', order: 100, run: runFn }));

			await runDataMigrations();

			expect(mockAcquireLock).toHaveBeenCalledWith('data_migrations');
			expect(mockReleaseLock).toHaveBeenCalledWith('data_migrations', { lastVersion: '8.3.0' });
		});

		it('should release lock even if migration throws', async () => {
			const runFn = jest.fn().mockRejectedValue(new Error('Migration failed'));
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

			addDataMigration(createMigration({ id: 'lock-release-on-error', order: 101, run: runFn }));

			await runDataMigrations();

			expect(mockReleaseLock).toHaveBeenCalledWith('data_migrations', { lastVersion: '8.3.0' });
		});

		it('should run a new migration that has no record', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

			addDataMigration(createMigration({ id: 'new-migration', order: 102, run: runFn }));

			await runDataMigrations();

			expect(runFn).toHaveBeenCalled();
			expect(mockUpdateOne).toHaveBeenCalledWith(
				{ _id: '00102_new-migration' },
				expect.objectContaining({
					$set: expect.objectContaining({ status: 'completed' }),
				}),
				{ upsert: true },
			);
		});

		it('should skip a once-strategy migration that already completed', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({
				toArray: jest
					.fn()
					.mockResolvedValue([createRecord({ _id: '00103_already-done', status: 'completed', lastRunHash: 'abc123', order: 103 })]),
			});

			addDataMigration(createMigration({ id: 'already-done', order: 103, strategy: 'once', run: runFn }));

			await runDataMigrations();

			expect(runFn).not.toHaveBeenCalled();
		});

		it('should retry a failed migration', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({
				toArray: jest.fn().mockResolvedValue([createRecord({ _id: '00104_failed-migration', status: 'failed', order: 104 })]),
			});

			addDataMigration(createMigration({ id: 'failed-migration', order: 104, run: runFn }));

			await runDataMigrations();

			expect(runFn).toHaveBeenCalled();
		});

		it('should run every-upgrade migration when hash changes', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({
				toArray: jest
					.fn()
					.mockResolvedValue([createRecord({ _id: '00105_upgrade-migration', status: 'completed', lastRunHash: 'old-hash', order: 105 })]),
			});

			addDataMigration(createMigration({ id: 'upgrade-migration', order: 105, strategy: 'every-upgrade', run: runFn }));

			await runDataMigrations();

			expect(runFn).toHaveBeenCalled();
		});

		it('should skip every-upgrade migration when hash is the same', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({
				toArray: jest
					.fn()
					.mockResolvedValue([createRecord({ _id: '00106_same-hash', status: 'completed', lastRunHash: 'abc123', order: 106 })]),
			});

			addDataMigration(createMigration({ id: 'same-hash', order: 106, strategy: 'every-upgrade', run: runFn }));

			await runDataMigrations();

			expect(runFn).not.toHaveBeenCalled();
		});

		it('should record failure when migration throws', async () => {
			const runFn = jest.fn().mockRejectedValue(new Error('Something broke'));
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

			addDataMigration(createMigration({ id: 'failing-migration', order: 107, run: runFn }));

			await runDataMigrations();

			expect(mockUpdateOne).toHaveBeenCalledWith(
				{ _id: '00107_failing-migration' },
				expect.objectContaining({
					$set: expect.objectContaining({ status: 'failed', lastError: 'Something broke' }),
				}),
				{ upsert: true },
			);
			expect(mockShowWarningBox).toHaveBeenCalled();
		});

		it('should call process.exit when fatal migration fails', async () => {
			const runFn = jest.fn().mockRejectedValue(new Error('Fatal error'));
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

			addDataMigration(createMigration({ id: 'fatal-migration', order: 108, fatal: true, run: runFn }));

			await runDataMigrations();

			expect(processExitSpy).toHaveBeenCalledWith(1);
		});

		it('should run migrations in order', async () => {
			const callOrder: number[] = [];
			const runA = jest.fn().mockImplementation(() => callOrder.push(1));
			const runB = jest.fn().mockImplementation(() => callOrder.push(2));
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

			addDataMigration(createMigration({ id: 'order-b', order: 110, run: runB }));
			addDataMigration(createMigration({ id: 'order-a', order: 109, run: runA }));

			await runDataMigrations();

			expect(callOrder).toEqual([1, 2]);
		});
	});

	describe('direction filtering', () => {
		it('should skip downgrade-only migration during upgrade', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

			addDataMigration(createMigration({ id: 'downgrade-only', order: 200, direction: 'downgrade', run: runFn }));

			await runDataMigrations();

			expect(runFn).not.toHaveBeenCalled();
		});

		it('should run both-direction migration during upgrade', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

			addDataMigration(createMigration({ id: 'both-direction', order: 201, direction: 'both', run: runFn }));

			await runDataMigrations();

			expect(runFn).toHaveBeenCalled();
		});

		it('should skip upgrade-only migration during downgrade (by order)', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
			mockFindOne.mockResolvedValue(createRecord({ _id: '99999_future', order: 99999, status: 'completed' }));

			addDataMigration(createMigration({ id: 'upgrade-only-downgrade', order: 202, direction: 'upgrade', run: runFn }));

			await runDataMigrations();

			expect(runFn).not.toHaveBeenCalled();
		});

		it('should run downgrade-only migration during downgrade (by order)', async () => {
			const runFn = jest.fn();
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
			mockFindOne.mockResolvedValue(createRecord({ _id: '99999_future', order: 99999, status: 'completed' }));

			addDataMigration(createMigration({ id: 'downgrade-run', order: 203, direction: 'downgrade', run: runFn }));

			await runDataMigrations();

			expect(runFn).toHaveBeenCalled();
		});
	});

	describe('version-based downgrade detection', () => {
		it('should detect downgrade by version number', async () => {
			const runFn = jest.fn();
			mockAcquireLock.mockResolvedValue({
				acquired: true,
				record: { _id: 'data_migrations', locked: true, extraData: { lastVersion: '8.5.0' } },
			});
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
			mockInfoObj.version = '8.3.0';

			addDataMigration(createMigration({ id: 'version-downgrade-skip', order: 300, direction: 'upgrade', run: runFn }));

			await runDataMigrations();

			expect(runFn).not.toHaveBeenCalled();
		});

		it('should detect downgrade ignoring version suffix', async () => {
			const runFn = jest.fn();
			mockAcquireLock.mockResolvedValue({
				acquired: true,
				record: { _id: 'data_migrations', locked: true, extraData: { lastVersion: '8.5.0-rc.1' } },
			});
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
			mockInfoObj.version = '8.3.0-develop';

			addDataMigration(createMigration({ id: 'version-suffix-downgrade', order: 301, direction: 'upgrade', run: runFn }));

			await runDataMigrations();

			expect(runFn).not.toHaveBeenCalled();
		});

		it('should not detect downgrade when version is higher', async () => {
			const runFn = jest.fn();
			mockAcquireLock.mockResolvedValue({
				acquired: true,
				record: { _id: 'data_migrations', locked: true, extraData: { lastVersion: '8.2.0' } },
			});
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
			mockInfoObj.version = '8.3.0';

			addDataMigration(createMigration({ id: 'version-upgrade', order: 302, direction: 'upgrade', run: runFn }));

			await runDataMigrations();

			expect(runFn).toHaveBeenCalled();
		});

		it('should handle missing lastVersion gracefully (treat as upgrade)', async () => {
			const runFn = jest.fn();
			mockAcquireLock.mockResolvedValue({
				acquired: true,
				record: { _id: 'data_migrations', locked: true },
			});
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

			addDataMigration(createMigration({ id: 'no-last-version', order: 303, direction: 'upgrade', run: runFn }));

			await runDataMigrations();

			expect(runFn).toHaveBeenCalled();
		});
	});

	describe('manual reversion check', () => {
		it('should call process.exit when downgrade has migrations requiring manual reversion', async () => {
			// First call: find records for registered migrations
			mockFind
				.mockReturnValueOnce({ toArray: jest.fn().mockResolvedValue([]) })
				// Second call: checkManualReversions
				.mockReturnValueOnce({
					toArray: jest.fn().mockResolvedValue([
						createRecord({
							_id: '99998_manual-revert',
							order: 99998,
							status: 'completed',
							requiresManualReversion: true,
							manualReversionInstructions: 'Drop the xyz collection',
						}),
					]),
				});

			// highestCompletedBeyondRegistered triggers downgrade
			mockFindOne.mockResolvedValue(createRecord({ _id: '99999_future', order: 99999, status: 'completed' }));

			addDataMigration(createMigration({ id: 'manual-revert-check', order: 400 }));

			await runDataMigrations();

			expect(mockShowErrorBox).toHaveBeenCalledWith(
				'ERROR! SERVER STOPPED - MANUAL DATA REVERSION REQUIRED',
				expect.stringContaining('manual reversion'),
			);
			expect(processExitSpy).toHaveBeenCalledWith(1);
		});

		it('should not block downgrade when no migrations require manual reversion', async () => {
			const runFn = jest.fn();
			mockFind
				.mockReturnValueOnce({ toArray: jest.fn().mockResolvedValue([]) })
				.mockReturnValueOnce({ toArray: jest.fn().mockResolvedValue([]) });

			mockFindOne.mockResolvedValue(createRecord({ _id: '99999_future', order: 99999, status: 'completed' }));

			addDataMigration(createMigration({ id: 'no-manual-revert', order: 401, direction: 'downgrade', run: runFn }));

			await runDataMigrations();

			expect(processExitSpy).not.toHaveBeenCalled();
			expect(runFn).toHaveBeenCalled();
		});
	});

	describe('saves lastVersion on release', () => {
		it('should pass lastVersion in extraData when releasing lock', async () => {
			mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
			mockInfoObj.version = '9.0.0';

			addDataMigration(createMigration({ id: 'release-version', order: 500 }));

			await runDataMigrations();

			expect(mockReleaseLock).toHaveBeenCalledWith('data_migrations', { lastVersion: '9.0.0' });
		});
	});
});
