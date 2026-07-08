import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Migrate Room_Toolbox_Layout to per-scope settings',
	async up() {
		const oldSetting = await Settings.findOneById('Room_Toolbox_Layout');
		if (oldSetting && typeof oldSetting.value === 'string' && oldSetting.value !== '') {
			const oldValue = oldSetting.value;
			await Settings.updateMany(
				{ _id: { $in: ['Room_Toolbox_Layout_Public', 'Room_Toolbox_Layout_Private', 'Room_Toolbox_Layout_Direct'] }, value: '' },
				{ $set: { value: oldValue } },
			);
		}
		await Settings.deleteMany({ _id: { $in: ['Room_Toolbox_Layout'] } });
	},
});
