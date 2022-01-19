import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 185,
	async up() {
		const setting = await Settings.findOne({ _id: 'Message_SetNameToAliasEnabled' });
		if (setting?.value) {
			await Settings.update(
				{ _id: 'UI_Use_Real_Name' },
				{
					$set: {
						value: true,
					},
				},
			);
		}
		return Settings.removeById('Message_SetNameToAliasEnabled');
	},
});
