import type { IControl } from '@rocket.chat/core-typings';
import { MigrationsRaw } from '@rocket.chat/models';
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

const BUILD_DATE = new Date('2026-10-01T00:00:00Z');

const mockSleep = jest.fn();

jest.mock('../../lib/utils/sleep', () => ({
	sleep: (ms: number) => mockSleep(ms),
}));

jest.mock('../../rocketchat.info', () => ({
	Info: {
		version: '8.10.0',
		build: { date: BUILD_DATE },
		commit: { hash: 'abc123', date: '2026-10-01', branch: 'develop', tag: '' },
	},
}));

let mongo: MongoMemoryServer;
let client: MongoClient;
let db: Db;
let migrationsModel: MigrationsRaw;

const loadRunner = () => {
	let runner!: typeof import('./migrations');
	jest.isolateModules(() => {
		require('@rocket.chat/models').registerModel('IMigrationsModel', migrationsModel);
		runner = require('./migrations');
	});
	return runner;
};

const seedControl = (control: Omit<IControl, '_id' | '_updatedAt'>) => migrationsModel.insertOne({ _id: 'control', ...control });

const readControl = () => migrationsModel.findOneById('control');

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	client = await MongoClient.connect(mongo.getUri());
	db = client.db('migrations_test');
	migrationsModel = new MigrationsRaw(db);
});

afterAll(async () => {
	await client.close();
	await mongo.stop();
});

beforeEach(async () => {
	await db.collection('migrations').deleteMany({});
	mockSleep.mockReset().mockResolvedValue(undefined);
	jest.spyOn(process, 'exit').mockImplementation((code) => {
		throw new Error(`process.exit(${code})`);
	});
	jest.spyOn(console, 'log');
});

afterEach(() => {
	jest.useRealTimers();
});

describe('addMigration', () => {
	it('rejects a migration without a version or an up()', () => {
		const { addMigration } = loadRunner();

		expect(() => addMigration({ version: 0, up: jest.fn() })).toThrow('Migration version is required');
		expect(() => addMigration({ version: 1 } as unknown as Parameters<typeof addMigration>[0])).toThrow('Migration up() is required');
	});
});

describe('migrateDatabase', () => {
	describe('fresh database', () => {
		it('sets the control to the latest version without running any migration', async () => {
			const { addMigration, migrateDatabase } = loadRunner();
			const up = jest.fn();
			addMigration({ version: 1, up });
			addMigration({ version: 2, up });

			await expect(migrateDatabase('latest')).resolves.toBe(true);

			expect(up).not.toHaveBeenCalled();
			expect(await readControl()).toMatchObject({ version: 2, locked: false });
		});
	});

	describe('lock', () => {
		const runOneUpgrade = async () => {
			const { addMigration, migrateDatabase } = loadRunner();
			const up = jest.fn();
			addMigration({ version: 1, up: jest.fn() });
			addMigration({ version: 2, up });
			const result = await migrateDatabase('latest');
			return { result, up };
		};

		it('takes over a lock held for more than 5 minutes', async () => {
			await seedControl({ version: 1, locked: true, lockedAt: minutesAgo(6), buildAt: BUILD_DATE });

			const { up } = await runOneUpgrade();

			expect(up).toHaveBeenCalledTimes(1);
		});

		it('takes over a lock held by a different build', async () => {
			await seedControl({ version: 1, locked: true, lockedAt: new Date(), buildAt: new Date('2026-01-01T00:00:00Z') });

			const { up } = await runOneUpgrade();

			expect(up).toHaveBeenCalledTimes(1);
		});

		it('waits and retries while another instance of the same build holds the lock', async () => {
			await seedControl({ version: 1, locked: true, lockedAt: minutesAgo(4), buildAt: BUILD_DATE });
			mockSleep.mockImplementationOnce(() => migrationsModel.updateOne({ _id: 'control' }, { $set: { locked: false } }));

			const { up } = await runOneUpgrade();

			expect(mockSleep).toHaveBeenCalledTimes(1);
			expect(mockSleep).toHaveBeenCalledWith(10_000);
			expect(up).toHaveBeenCalledTimes(1);
		});

		it('makes a second instance wait while the first one is migrating', async () => {
			await seedControl({ version: 1, locked: false, lockedAt: minutesAgo(6), buildAt: new Date('2026-01-01T00:00:00Z') });
			const first = loadRunner();
			const second = loadRunner();
			const secondUp = jest.fn();
			second.addMigration({ version: 1, up: jest.fn() });
			second.addMigration({ version: 2, up: secondUp });
			let secondRun: Promise<boolean> | undefined;
			first.addMigration({ version: 1, up: jest.fn() });
			first.addMigration({
				version: 2,
				up: async () => {
					secondRun = second.migrateDatabase('latest');
					await secondRun.catch(() => undefined);
				},
			});
			mockSleep.mockRejectedValueOnce(new Error('waited'));

			await first.migrateDatabase('latest');

			await expect(secondRun).rejects.toThrow('waited');
			expect(secondUp).not.toHaveBeenCalled();
		});

		it('takes over a lock left by a crashed instance once it goes stale while retrying', async () => {
			jest.useFakeTimers({
				now: new Date(),
				doNotFake: [
					'nextTick',
					'queueMicrotask',
					'setImmediate',
					'clearImmediate',
					'setInterval',
					'clearInterval',
					'setTimeout',
					'clearTimeout',
					'hrtime',
					'performance',
				],
			});
			await seedControl({ version: 1, locked: true, lockedAt: new Date(), buildAt: BUILD_DATE });
			mockSleep.mockImplementation((ms: number) => jest.setSystemTime(Date.now() + ms));

			const { up } = await runOneUpgrade();

			expect(up).toHaveBeenCalledTimes(1);
		});

		it('stops the server with exit status 1 when the lock never becomes available', async () => {
			await seedControl({ version: 1, locked: true, lockedAt: new Date(), buildAt: BUILD_DATE });

			await expect(runOneUpgrade()).rejects.toThrow('process.exit(1)');

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Your database migration control is locked.'));
			expect(await readControl()).toMatchObject({ version: 1, locked: true });
		});
	});

	describe('upgrade', () => {
		it('runs the pending migrations in increasing version order and unlocks at the target', async () => {
			await seedControl({ version: 1, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			const ran: number[] = [];
			const record = ({ version }: { version: number }) => {
				ran.push(version);
			};
			addMigration({ version: 3, up: record });
			addMigration({ version: 1, up: record });
			addMigration({ version: 4, up: record });
			addMigration({ version: 2, up: record });

			await migrateDatabase(3);

			expect(ran).toEqual([2, 3]);
			expect(await readControl()).toMatchObject({ version: 3, locked: false });
		});

		it('persists the version of each completed migration before running the next one', async () => {
			await seedControl({ version: 1, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			let controlDuringLastStep: IControl | null = null;
			addMigration({ version: 1, up: jest.fn() });
			addMigration({ version: 2, up: jest.fn() });
			addMigration({
				version: 3,
				up: async () => {
					controlDuringLastStep = await readControl();
				},
			});

			await migrateDatabase('latest');

			expect(controlDuringLastStep).toMatchObject({ version: 2, locked: true });
		});

		it('exits with status 0 after migrating when the exit subcommand is given', async () => {
			await seedControl({ version: 1, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			addMigration({ version: 1, up: jest.fn() });
			addMigration({ version: 2, up: jest.fn() });

			await expect(migrateDatabase('latest', ['exit'])).rejects.toThrow('process.exit(0)');

			expect(await readControl()).toMatchObject({ version: 2, locked: false });
		});
	});

	describe('downgrade', () => {
		it('runs down() in decreasing version order and unlocks at the target', async () => {
			await seedControl({ version: 3, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			const ran: number[] = [];
			const record = ({ version }: { version: number }) => {
				ran.push(version);
			};
			addMigration({ version: 1, up: jest.fn(), down: record });
			addMigration({ version: 2, up: jest.fn(), down: record });
			addMigration({ version: 3, up: jest.fn(), down: record });

			await migrateDatabase(1);

			expect(ran).toEqual([3, 2]);
			expect(await readControl()).toMatchObject({ version: 1, locked: false });
		});

		it('stops the server at a migration without down() and keeps the last completed version', async () => {
			await seedControl({ version: 3, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			addMigration({ version: 1, up: jest.fn() });
			addMigration({ version: 2, up: jest.fn() });
			addMigration({ version: 3, up: jest.fn(), down: jest.fn() });

			await expect(migrateDatabase(1)).rejects.toThrow('process.exit(1)');

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cannot migrate down on version 2'));
			expect(await readControl()).toMatchObject({ version: 2 });
		});
	});

	describe('already at target', () => {
		it('unlocks and returns without running any migration', async () => {
			await seedControl({ version: 2, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			const up = jest.fn();
			addMigration({ version: 1, up });
			addMigration({ version: 2, up });

			await expect(migrateDatabase('latest')).resolves.toBe(true);

			expect(up).not.toHaveBeenCalled();
			expect(await readControl()).toMatchObject({ version: 2, locked: false });
		});
	});

	describe('rerun', () => {
		it('runs up() of the target again and keeps the current version', async () => {
			await seedControl({ version: 3, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			const up2 = jest.fn();
			const up3 = jest.fn();
			addMigration({ version: 1, up: jest.fn() });
			addMigration({ version: 2, up: up2 });
			addMigration({ version: 3, up: up3 });

			await expect(migrateDatabase(2, ['rerun'])).resolves.toBe(true);

			expect(up2).toHaveBeenCalledTimes(1);
			expect(up3).not.toHaveBeenCalled();
			expect(await readControl()).toMatchObject({ version: 3, locked: false });
		});
	});

	describe('unknown versions', () => {
		it('rejects a current version that is not a registered migration', async () => {
			await seedControl({ version: 5, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			const up = jest.fn();
			addMigration({ version: 1, up });
			addMigration({ version: 2, up });

			await expect(migrateDatabase('latest')).rejects.toThrow("Can't find migration version 5");

			expect(up).not.toHaveBeenCalled();
			expect(await readControl()).toMatchObject({ version: 5 });
		});

		it('rejects a target version that is not a registered migration', async () => {
			await seedControl({ version: 1, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			const up = jest.fn();
			addMigration({ version: 1, up });
			addMigration({ version: 2, up });

			await expect(migrateDatabase(7)).rejects.toThrow("Can't find migration version 7");

			expect(up).not.toHaveBeenCalled();
			expect(await readControl()).toMatchObject({ version: 1 });
		});
	});

	describe('migration failure', () => {
		it('reports the error, stops with exit status 1 and keeps the last completed version', async () => {
			await seedControl({ version: 1, locked: false });
			const { addMigration, migrateDatabase } = loadRunner();
			const up4 = jest.fn();
			addMigration({ version: 1, up: jest.fn() });
			addMigration({ version: 2, up: jest.fn() });
			addMigration({
				version: 3,
				up: () => {
					throw new Error('boom');
				},
			});
			addMigration({ version: 4, up: up4 });

			await expect(migrateDatabase('latest')).rejects.toThrow('process.exit(1)');

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('boom'));
			expect(up4).not.toHaveBeenCalled();
			expect(await readControl()).toMatchObject({ version: 2 });
		});
	});
});
