import { Settings } from '@rocket.chat/models';
import type { UpdateResult } from 'mongodb';

import { upsertPermissions } from '../../../app/authorization/server/functions/upsertPermissions';
import { settings } from '../../../app/settings/server';
import { migrateDatabase, onServerVersionChange } from '../../lib/migrations';
import { ensureCloudWorkspaceRegistered } from '../cloudRegistration';

const { MIGRATION_VERSION = 'latest' } = process.env;

const [version, ...subcommands] = MIGRATION_VERSION.split(',');

const maxAgeSettingMap = new Map([
	['RetentionPolicy_MaxAge_Channels', 'RetentionPolicy_TTL_Channels'],
	['RetentionPolicy_MaxAge_Groups', 'RetentionPolicy_TTL_Groups'],
	['RetentionPolicy_MaxAge_DMs', 'RetentionPolicy_TTL_DMs'],
]);

const moveRetentionSetting = async () => {
	const convertDaysToMs = (days: number) => days * 24 * 60 * 60 * 1000;

	const promises: Array<Promise<UpdateResult>> = [];
	await Settings.find(
		{ _id: { $in: Array.from(maxAgeSettingMap.keys()) }, value: { $ne: -1 } },
		{ projection: { _id: 1, value: 1 } },
	).forEach(({ _id, value }) => {
		const newSettingId = maxAgeSettingMap.get(_id);
		if (!newSettingId) {
			throw new Error(`moveRetentionSetting - Setting ${_id} equivalent does not exist`);
		}

		const newValue = convertDaysToMs(Number(value));

		promises.push(
			Settings.updateOne(
				{
					_id: maxAgeSettingMap.get(_id),
				},
				{
					$set: {
						value: newValue,
					},
				},
			),
		);

		const currentCache = settings.getSetting(newSettingId);
		if (!currentCache) {
			return;
		}
		settings.set({ ...currentCache, value: newValue });
	});

	await Promise.all(promises);
	await Settings.updateMany({ _id: { $in: Array.from(maxAgeSettingMap.keys()) } }, { $set: { value: -1 } });
};

export const performMigrationProcedure = async (): Promise<void> => {
	await migrateDatabase(version === 'latest' ? version : parseInt(version), subcommands);
	// perform operations when the server is starting with a different version
	await onServerVersionChange(async () => {
		await upsertPermissions();
		await ensureCloudWorkspaceRegistered();
		await moveRetentionSetting();
	});
};
