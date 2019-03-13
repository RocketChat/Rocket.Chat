import { Migrations } from '/app/migrations';
import { Settings } from '/app/models';

Migrations.add({
	version: 63,
	up() {
		const forward = Settings.findOne({ _id:'Livechat_forward_open_chats' });
		const timeout = Settings.findOne({ _id:'Livechat_forward_open_chats_timeout' });

		if (forward && forward.value) {
			Settings.upsert({ _id: 'Livechat_agent_leave_action' }, {
				$set: {
					value: 'forward',
					type: 'string',
					group: 'Livechat',
				},
			});
		}

		if (timeout && timeout.value !== 60) {
			Settings.upsert({ _id: 'Livechat_agent_leave_action_timeout' }, {
				$set: {
					value: timeout.value,
					type: 'int',
					group: 'Livechat',
				},
			});
		}

		Settings.remove({ _id: 'Livechat_forward_open_chats' });
		Settings.remove({ _id: 'Livechat_forward_open_chats_timeout' });
	},
});
