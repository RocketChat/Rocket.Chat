import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 219,
	async up() {
		const SettingIds = {
			old: 'Livechat_auto_close_abandoned_rooms',
			new: 'Livechat_abandoned_rooms_action',
		};

		const oldSetting = await Settings.findOne({ _id: SettingIds.old });
		if (!oldSetting) {
			return;
		}

		const oldValue = oldSetting.value;

		const newValue = oldValue && oldValue === true ? 'close' : 'none';

		Settings.update(
			{
				_id: SettingIds.new,
			},
			{
				$set: {
					value: newValue,
				},
			},
		);

		return Settings.removeById(SettingIds.old);
	},
});
