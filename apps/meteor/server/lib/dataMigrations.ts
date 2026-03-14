import { type IDataMigrationRecord, type ISystemLock, type ISystemLockMigration } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { DataMigrations, SystemLocks } from '@rocket.chat/models';
import semver from 'semver';

import { showErrorBox, showWarningBox } from './logger/showBox';
import { Info } from '../../app/utils/rocketchat.info';
import { sleep } from '../../lib/utils/sleep';

type DataMigrationStrategy = 'once' | 'every-upgrade';
type DataMigrationDirection = 'upgrade' | 'downgrade' | 'both';

interface IDataMigrationBase {
	id: string;
	description: string;
	strategy: DataMigrationStrategy;
	order: number;
	direction?: DataMigrationDirection;
	fatal?: boolean;
	run: () => Promise<void> | void;
}

interface IDataMigrationWithManualReversion extends IDataMigrationBase {
	requiresManualReversion: true;
	manualReversionInstructions: string;
}

interface IDataMigrationWithoutManualReversion extends IDataMigrationBase {
	requiresManualReversion: false;
}

type IDataMigration = IDataMigrationWithManualReversion | IDataMigrationWithoutManualReversion;

const isSystemLockMigration = (lock: ISystemLock): lock is ISystemLockMigration => {
	return lock._id === 'data_migrations';
};

const log = new Logger('DataMigrations');

const dataMigrations = new Map<string, IDataMigration>();

function getRecordId(migration: IDataMigration): string {
	return `${String(migration.order).padStart(5, '0')}_${migration.id}`;
}

export function addDataMigration(migration: IDataMigration): void {
	if (!migration.id) {
		throw new Error('Data migration id is required');
	}
	if (!migration.description) {
		throw new Error('Data migration description is required');
	}
	if (!migration.run) {
		throw new Error('Data migration run() is required');
	}
	if (migration.order < 0) {
		throw new Error('Data migration order must be a positive integer');
	}

	if (dataMigrations.has(migration.id)) {
		throw new Error(`Data migration with id "${migration.id}" is already registered`);
	}

	dataMigrations.set(migration.id, migration);
}

function isVersionDowngrade(previousVersion: string, currentVersion: string): boolean {
	const previous = semver.coerce(previousVersion);
	const current = semver.coerce(currentVersion);

	if (!previous || !current) {
		return false;
	}

	return semver.lt(current, previous);
}

const LOCK_KEY = 'data_migrations';
const maxAttempts = 30;
const retryInterval = 10;
let currentAttempt = 0;

function shouldRun(migration: IDataMigration, record: IDataMigrationRecord | undefined, isUpgrade: boolean): boolean {
	const direction = migration.direction ?? 'upgrade';

	if (direction === 'upgrade' && !isUpgrade) {
		return false;
	}

	if (direction === 'downgrade' && isUpgrade) {
		return false;
	}

	if (!record) {
		return true;
	}
	if (record.status === 'failed') {
		return true;
	}
	if (migration.strategy === 'once') {
		return false;
	}

	return true;
}

type LockReleaseFunction = (extraData?: Record<string, unknown>) => Promise<void>;

async function acquireLock(): Promise<{ record: ISystemLock; releaseLock: LockReleaseFunction }> {
	const result = await SystemLocks.acquireLock(LOCK_KEY);
	if (result.acquired && result.record) {
		const { lockKey } = result.record;
		if (!lockKey) {
			throw new Error('Lock acquired but lockKey is missing');
		}

		const renewInterval = setInterval(() => void SystemLocks.renewLockThreshold(LOCK_KEY, lockKey), 60 * 1000);

		return {
			record: result.record,
			releaseLock: async (extraData?: Record<string, unknown>) => {
				clearInterval(renewInterval);
				await SystemLocks.releaseLock(LOCK_KEY, lockKey, extraData);
			},
		};
	}

	if (currentAttempt <= maxAttempts) {
		log.warn({
			msg: 'Data migrations control is locked. Will retry.',
			retryIntervalSeconds: retryInterval,
			attempt: currentAttempt,
			maxAttempts,
		});

		await sleep(retryInterval * 1000);
		currentAttempt++;
		return acquireLock();
	}

	showErrorBox(
		'ERROR! SERVER STOPPED',
		[
			'Your data migrations control is locked.',
			'Please make sure you are running the latest version and try again.',
			'If the problem persists, please contact support.',
			'',
			`This Rocket.Chat version: ${Info.version}`,
			`Commit: ${Info.commit.hash}`,
			`Date: ${Info.commit.date}`,
			`Branch: ${Info.commit.branch}`,
			`Tag: ${Info.commit.tag}`,
		].join('\n'),
	);
	process.exit(1);
}

async function checkManualReversions(maxRegisteredOrder: number, releaseLock: LockReleaseFunction): Promise<void> {
	const requireManualReversion = await DataMigrations.find({
		order: { $gt: maxRegisteredOrder },
		status: 'completed',
		requiresManualReversion: true,
	}).toArray();

	if (requireManualReversion.length === 0) {
		return;
	}

	const migrationDetails = requireManualReversion
		.map((r) => {
			const header = `  - [${r._id}] (order: ${r.order})`;
			if (r.manualReversionInstructions) {
				return `${header}\n    Instructions: ${r.manualReversionInstructions}`;
			}
			return header;
		})
		.join('\n');

	showErrorBox(
		'ERROR! SERVER STOPPED - MANUAL DATA REVERSION REQUIRED',
		[
			'The following data migrations were applied by a newer version and require manual reversion before downgrading:',
			'',
			migrationDetails,
			'',
			'Please revert the data changes manually and remove the corresponding records from the data_migrations collection,',
			'or upgrade to the version that applied these migrations.',
			'',
			`This Rocket.Chat version: ${Info.version}`,
			`Commit: ${Info.commit.hash}`,
		].join('\n'),
	);

	await releaseLock();

	process.exit(1);
}

export async function runDataMigrations(): Promise<void> {
	currentAttempt = 0;

	const currentHash = Info.commit.hash;

	if (!currentHash) {
		log.warn('Current commit hash is not available. Skipping data migrations.');
		return;
	}

	const ordered = Array.from(dataMigrations.values()).sort((a, b) => a.order - b.order);

	if (ordered.length === 0) {
		return;
	}

	const { record: lockRecord, releaseLock } = await acquireLock();

	try {
		const ids = ordered.map((m) => getRecordId(m));
		const records = await DataMigrations.find({ _id: { $in: ids } }).toArray();
		const recordMap = new Map(records.map((r) => [r._id, r]));

		const maxRegisteredOrder = ordered[ordered.length - 1].order;

		const highestCompletedBeyondRegistered = await DataMigrations.findOne(
			{
				order: { $gt: maxRegisteredOrder },
				status: 'completed',
			},
			{ sort: { order: -1 } },
		);

		const lastVersion = (lockRecord && isSystemLockMigration(lockRecord) && lockRecord.extraData?.lastVersion) || undefined;

		if (lastVersion === Info.version) {
			log.startup('Data migrations already ran for this version. Skipping.');
			await releaseLock();
			return;
		}

		const isDowngradeByVersion = lastVersion != null && Info.version != null && isVersionDowngrade(lastVersion, Info.version);
		const isDowngradeByOrder = !!highestCompletedBeyondRegistered;
		const isUpgrade = !isDowngradeByOrder && !isDowngradeByVersion;

		if (!isUpgrade) {
			log.startup({
				msg: 'Downgrade detected for data migrations',
				...(isDowngradeByOrder && { maxCompletedOrder: highestCompletedBeyondRegistered.order }),
				...(isDowngradeByVersion && { lastVersion, currentVersion: Info.version }),
				maxRegisteredOrder,
			});
			await checkManualReversions(maxRegisteredOrder, releaseLock);
		}

		for (const migration of ordered) {
			const recordId = getRecordId(migration);
			const record = recordMap.get(recordId);

			if (!shouldRun(migration, record, isUpgrade)) {
				continue;
			}

			log.startup(`Running data migration: [${recordId}] ${migration.description}`);

			try {
				await migration.run();

				await DataMigrations.updateOne(
					{ _id: recordId },
					{
						$set: {
							status: 'completed' as const,
							lastRunAt: new Date(),
							lastRunHash: currentHash,
							order: migration.order,
							requiresManualReversion: migration.requiresManualReversion,
							...(migration.requiresManualReversion && {
								manualReversionInstructions: migration.manualReversionInstructions,
							}),
						},
						$unset: {
							lastError: 1 as const,
						},
						$inc: { runCount: 1 },
					},
					{ upsert: true },
				);

				log.startup(`Completed data migration: [${recordId}]`);
			} catch (e: any) {
				const errorMsg = e?.message || 'Unknown error';

				await DataMigrations.updateOne(
					{ _id: recordId },
					{
						$set: {
							status: 'failed' as const,
							lastRunAt: new Date(),
							lastRunHash: currentHash,
							lastError: errorMsg,
							order: migration.order,
							requiresManualReversion: migration.requiresManualReversion,
							...(migration.requiresManualReversion && {
								manualReversionInstructions: migration.manualReversionInstructions,
							}),
						},
						$inc: { runCount: 1 },
					},
					{ upsert: true },
				);

				if (migration.fatal) {
					showWarningBox(
						'DATA MIGRATION FAILED (FATAL)',
						[`Migration "${recordId}" failed:`, errorMsg, '', 'Server cannot continue.'].join('\n'),
					);
					await releaseLock();
					process.exit(1);
				}

				showWarningBox(
					'DATA MIGRATION FAILED',
					[`Migration "${recordId}" failed:`, errorMsg, '', 'This migration will be retried on next startup.'].join('\n'),
				);
				log.error({ msg: 'Data migration failed', id: recordId, err: e });
			}
		}
	} finally {
		await releaseLock({ lastVersion: Info.version });
	}
}
