import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 148,
	up() {
		const oldSetting = Settings.findOne({ _id: 'Livechat_guest_pool_with_no_agents' });
		const { _id } = oldSetting;

		delete oldSetting._id;
		delete oldSetting.enableQuery;
		delete oldSetting.ts;
		delete oldSetting._updatedAt;

		Settings.remove({ _id });

		const newSetting = Object.assign(oldSetting, { _id: 'Livechat_accept_chats_with_no_agents' });
		Settings.insert(newSetting);
	},
});
