import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

const maxAgeSettings = ['RetentionPolicy_MaxAge_Channels', 'RetentionPolicy_MaxAge_Groups', 'RetentionPolicy_MaxAge_DMs'];

const convertDaysToMs = (days: number) => days * 24 * 60 * 60 * 1000;
addMigration({
	version: 305,
	name: 'Convert retention policy max age from days to milliseconds',
	async up() {
		// if the package value isn't 30 the setting has already been updated
		await Settings.find({ _id: { $in: maxAgeSettings }, packageValue: 30 }, { projection: { _id: 1, value: 1 } })
			.map(async ({ value, _id }) => {
				const newPackageValue = convertDaysToMs(30);
				const newValue = Number(value) >= 0 ? convertDaysToMs(Number(value)) : newPackageValue;

				await Settings.updateOne({ _id }, { $set: { value: newValue, packageValue: newPackageValue } });
			})
			.toArray();
	},
});
