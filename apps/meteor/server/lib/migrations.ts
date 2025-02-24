import type { IControl } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Migrations } from '@rocket.chat/models';

import { showErrorBox } from './logger/showBox';
import { Info } from '../../app/utils/rocketchat.info';
import { sleep } from '../../lib/utils/sleep';

type IMigration = {
	name?: string;
	version: number;
	up: (migration: IMigration) => Promise<void> | void;
	down?: (migration: IMigration) => Promise<void> | void;
};

const log = new Logger('Migrations');

const migrations = new Set<IMigration>();

// sets the control record
function setControl(control: Pick<IControl, 'version' | 'locked'>): Pick<IControl, 'version' | 'locked'> {
	void Migrations.updateMany(
		{
			_id: 'control',
		},
		{
			$set: {
				version: control.version,
				locked: control.locked,
			},
		},
		{
			upsert: true,
		},
	);

	return control;
}

// gets the current control record, optionally creating it if non-existant
export async function getControl(): Promise<IControl> {
	const control = (await Migrations.findOne({
		_id: 'control',
	})) as IControl;

	return (
		control ||
		setControl({
			version: 0,
			locked: false,
		})
	);
}

// Returns true if lock was acquired.
async function lock(): Promise<boolean> {
	const date = new Date();
	const dateMinusInterval = new Date();
	dateMinusInterval.setMinutes(dateMinusInterval.getMinutes() - 5);

	const build = Info ? Info.build.date : date;

	// This is atomic. The selector ensures only one caller at a time will see
	// the unlocked control, and locking occurs in the same update's modifier.
	// All other simultaneous callers will get false back from the update.
	return (
		(
			await Migrations.updateMany(
				{
					_id: 'control',
					$or: [
						{
							locked: false,
						},
						{
							lockedAt: {
								$lt: dateMinusInterval,
							},
						},
						{
							buildAt: {
								$ne: build,
							},
						},
					],
				},
				{
					$set: {
						locked: true,
						lockedAt: date,
						buildAt: build,
					},
				},
			)
		).matchedCount === 1
	);
}

export function addMigration(migration: IMigration): void {
	if (!migration?.version) {
		throw new Error('Migration version is required');
	}
	if (!migration?.up) {
		throw new Error('Migration up() is required');
	}
	migrations.add(migration);
}

// Side effect: saves version.
function unlock(version: number): void {
	setControl({
		locked: false,
		version,
	});
}

function getOrderedMigrations(): IMigration[] {
	return Array.from(migrations).sort((a, b) => a.version - b.version);
}

function showError(version: number, control: IControl, e: any): void {
	showErrorBox(
		'ERROR! SERVER STOPPED',
		[
			'Your database migration failed:',
			e.message,
			'',
			'Please make sure you are running the latest version and try again.',
			'If the problem persists, please contact support.',
			'',
			`This Rocket.Chat version: ${Info.version}`,
			`Database locked at version: ${control.version}`,
			`Database target version: ${version}`,
			'',
			`Commit: ${Info.commit.hash}`,
			`Date: ${Info.commit.date}`,
			`Branch: ${Info.commit.branch}`,
			`Tag: ${Info.commit.tag}`,
		].join('\n'),
	);
}

// run the actual migration
async function migrate(direction: 'up' | 'down', migration: IMigration): Promise<void> {
	if (typeof migration[direction] !== 'function') {
		throw new Error(`Cannot migrate ${direction} on version ${migration.version}`);
	}

	log.startup(`Running ${direction}() on version ${migration.version}${migration.name ? `(${migration.name})` : ''}`);

	await migration[direction]?.(migration);
}

const maxAttempts = 30;
const retryInterval = 10;
let currentAttempt = 0;

export async function migrateDatabase(targetVersion: 'latest' | number, subcommands?: string[]): Promise<boolean> {
	const control = await getControl();
	const currentVersion = control.version;

	const orderedMigrations = getOrderedMigrations();

	if (orderedMigrations.length === 0) {
		log.startup('No migrations to run');
		return true;
	}

	// version 0 means it is a fresh database, just set the control to latest known version and skip
	if (currentVersion === 0) {
		setControl({
			locked: false,
			version: orderedMigrations[orderedMigrations.length - 1].version,
		});
		return true;
	}

	const version = targetVersion === 'latest' ? orderedMigrations[orderedMigrations.length - 1].version : targetVersion;

	// get latest version
	// const { version } = orderedMigrations[orderedMigrations.length - 1];

	if (!(await lock())) {
		const msg = `Not migrating, control is locked. Attempt ${currentAttempt}/${maxAttempts}`;
		if (currentAttempt <= maxAttempts) {
			log.warn(`${msg}. Trying again in ${retryInterval} seconds.`);

			await sleep(retryInterval * 1000);

			currentAttempt++;
			return migrateDatabase(targetVersion, subcommands);
		}
		const control = await getControl(); // Side effect: upserts control document.
		showErrorBox(
			'ERROR! SERVER STOPPED',
			[
				'Your database migration control is locked.',
				'Please make sure you are running the latest version and try again.',
				'If the problem persists, please contact support.',
				'',
				`This Rocket.Chat version: ${Info.version}`,
				`Database locked at version: ${control.version}`,
				`Database target version: ${version}`,
				'',
				`Commit: ${Info.commit.hash}`,
				`Date: ${Info.commit.date}`,
				`Branch: ${Info.commit.branch}`,
				`Tag: ${Info.commit.tag}`,
			].join('\n'),
		);
		process.exit(1);
	}

	if (subcommands?.includes('rerun')) {
		log.startup(`Rerunning version ${targetVersion}`);
		const migration = orderedMigrations.find((migration) => migration.version === targetVersion);

		if (!migration) {
			throw new Error(`Cannot rerun migration ${targetVersion}`);
		}

		try {
			await migrate('up', migration);
		} catch (e) {
			showError(version, control, e);
			log.error({ err: e });
			process.exit(1);
		}
		log.startup('Finished migrating.');
		unlock(currentVersion);
		return true;
	}

	if (currentVersion === version) {
		log.startup(`Not migrating, already at version ${version}`);
		unlock(currentVersion);
		return true;
	}

	const startIdx = orderedMigrations.findIndex((migration) => migration.version === currentVersion);
	if (startIdx === -1) {
		throw new Error(`Can't find migration version ${currentVersion}`);
	}

	const endIdx = orderedMigrations.findIndex((migration) => migration.version === version);
	if (endIdx === -1) {
		throw new Error(`Can't find migration version ${version}`);
	}

	log.startup(`Migrating from version ${orderedMigrations[startIdx].version} -> ${orderedMigrations[endIdx].version}`);

	try {
		const migrations = [];
		if (currentVersion < version) {
			for (let i = startIdx; i < endIdx; i++) {
				migrations.push(async () => {
					await migrate('up', orderedMigrations[i + 1]);
					setControl({
						locked: true,
						version: orderedMigrations[i + 1].version,
					});
				});
			}
		} else {
			for (let i = startIdx; i > endIdx; i--) {
				migrations.push(async () => {
					await migrate('down', orderedMigrations[i]);
					setControl({
						locked: true,
						version: orderedMigrations[i - 1].version,
					});
				});
			}
		}
		for await (const migration of migrations) {
			await migration();
		}
	} catch (e) {
		showError(version, control, e);
		log.error({ err: e });
		process.exit(1);
	}

	unlock(orderedMigrations[endIdx].version);
	log.startup('Finished migrating.');

	// remember to run meteor with --once otherwise it will restart
	if (subcommands?.includes('exit')) {
		process.exit(0);
	}

	return true;
}

export async function onServerVersionChange(cb: () => Promise<void>): Promise<void> {
	const result = await Migrations.findOneAndUpdate(
		{
			_id: 'upgrade',
		},
		{
			$set: {
				hash: Info.commit.hash,
			},
		},
		{
			upsert: true,
		},
	);

	if (result?.hash === Info.commit.hash) {
		return;
	}

	await cb();
}
