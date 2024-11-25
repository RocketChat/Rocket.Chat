import { Settings } from '@rocket.chat/models';
import type { UpdateResult } from 'mongodb';

import { settings } from '../../../app/settings/server';
import { addMigration } from '../../lib/migrations';

const maxAgeSettingMap = new Map([
	['RetentionPolicy_MaxAge_Channels', 'RetentionPolicy_TTL_Channels'],
	['RetentionPolicy_MaxAge_Groups', 'RetentionPolicy_TTL_Groups'],
	['RetentionPolicy_MaxAge_DMs', 'RetentionPolicy_TTL_DMs'],
]);

addMigration({
	version: 318,
	name: 'Move retention policy settings',
	async up() {
		const convertDaysToMs = (days: number) => days * 24 * 60 * 60 * 1000;

		const promises: Array<Promise<UpdateResult>> = [];
		await Settings.find(
			// we have to test value to avoid updating records that were changed before this version
			{ _id: { $in: Array.from(maxAgeSettingMap.keys()) }, value: { $ne: -1 } },
			{ projection: { _id: 1, value: 1 } },
		).forEach(({ _id, value }) => {
			const newSettingId = maxAgeSettingMap.get(_id);
			if (!newSettingId) {
				throw new Error(`moveRetentionSetting - Setting ${_id} equivalent does not exist`);
			}

			const newValue = convertDaysToMs(Number(value));

			// TODO: audit

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

			// This is necessary because the cachedCollection is started before watchDb is initialized
			const currentCache = settings.getSetting(newSettingId);
			if (!currentCache) {
				return;
			}
			settings.set({ ...currentCache, value: newValue });
		});

		await Promise.all(promises);
		await Settings.deleteMany({ _id: { $in: Array.from(maxAgeSettingMap.keys()) } });
	},
});
