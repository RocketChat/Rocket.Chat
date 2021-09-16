import { Settings } from '../../../app/models/server';
import { Migrations } from '../../../app/migrations';

Migrations.add({
	version: 229,
	up() {
		const oldNamesValidationSetting = Settings.findOneById(
			'UTF8_Names_Validation',
		);
		const oldNamesValidationSettingValue = oldNamesValidationSetting?.value || '[0-9a-zA-Z-_.]+';

		Settings.upsert(
			{
				_id: 'UTF8_User_Names_Validation',
			},
			{
				$set: {
					value: oldNamesValidationSettingValue,
				},
			},
		);

		Settings.upsert(
			{
				_id: 'UTF8_Channel_Names_Validation',
			},
			{
				$set: {
					value: oldNamesValidationSettingValue,
				},
			},
		);

		Settings.removeById('UTF8_Names_Validation');
	},
});
