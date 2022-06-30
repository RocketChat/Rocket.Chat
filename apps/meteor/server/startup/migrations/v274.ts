import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 274,
	async up() {
		const oldSettings = await Settings.findOne({ _id: 'email_style' });
		if (!oldSettings) {
			return;
		}

		const newValue = `${oldSettings.value} .rc-color { color: #F5455C; }`;
		const newPackageValue = `${oldSettings.packageValue} .rc-color { color: #F5455C; }`;

		await Settings.updateOne(
			{
				_id: 'email_style',
			},
			{
				$set: {
					value: newValue,
					packageValue: newPackageValue,
				},
			},
		);
	},
});
