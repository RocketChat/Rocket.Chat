import { Sessions, Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 277,
	async up() {
		try {
			await Promise.allSettled(
				['instanceId_1_sessionId_1_year_1_month_1_day_1', 'instanceId_1_sessionId_1', 'type_1'].map((idx) => Sessions.col.dropIndex(idx)),
			);
		} catch (error: unknown) {
			console.warn('Error recreating index for rocketchat_sessions, continuing...');
			console.warn(error);
		}

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
