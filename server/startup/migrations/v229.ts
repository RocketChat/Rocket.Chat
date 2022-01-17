import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 229,
	async up() {
		const oldNamesValidationSetting = await Settings.findOneById('UTF8_Names_Validation');
		const oldNamesValidationSettingValue = oldNamesValidationSetting?.value || '[0-9a-zA-Z-_.]+';

		Settings.update(
			{
				_id: 'UTF8_User_Names_Validation',
			},
			{
				$set: {
					value: oldNamesValidationSettingValue,
				},
			},
			{
				upsert: true,
			},
		);

		Settings.update(
			{
				_id: 'UTF8_Channel_Names_Validation',
			},
			{
				$set: {
					value: oldNamesValidationSettingValue,
				},
			},
			{
				upsert: true,
			},
		);

		return Settings.removeById('UTF8_Names_Validation');
	},
});
