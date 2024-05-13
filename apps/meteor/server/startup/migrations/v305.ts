import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

const maxAgeSettings = ['RetentionPolicy_MaxAge_Channels', 'RetentionPolicy_MaxAge_Groups', 'RetentionPolicy_MaxAge_DMs'];

const convertDaysToMs = (days: number) => days * 24 * 60 * 60 * 1000;
addMigration({
	version: 305,
	name: 'Convert retention policy max age from days to milliseconds',
	async up() {
		await Promise.all(
			(
				await Settings.findByIds(maxAgeSettings).toArray()
			).map(async ({ value, packageValue, _id }) => {
				// if the package value isn't 30 the setting has already been updated
				if (packageValue !== 30) {
					return;
				}

				const newPackageValue = convertDaysToMs(30);
				// make sure the check passes if the number is 0;
				const newValue = Number(value) + 1 ? convertDaysToMs(Number(value)) : newPackageValue;

				return Settings.updateOne({ _id }, { $set: { value: newValue, packageValue: newPackageValue } });
			}),
		);
	},
});
