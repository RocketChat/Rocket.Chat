RocketChat.Migrations.add({
	version: 63,
	up() {
		const forward = RocketChat.models.Settings.findOne({ _id:'Livechat_forward_open_chats' });
		const timeout = RocketChat.models.Settings.findOne({ _id:'Livechat_forward_open_chats_timeout' });

		if (forward && forward.value) {
			RocketChat.models.Settings.upsert({ _id: 'Livechat_agent_leave_action' }, {
				$set: {
					value: 'forward',
					type: 'string',
					group: 'Livechat'
				}
			});
		}

		if (timeout && timeout.value !== 60) {
			RocketChat.models.Settings.upsert({ _id: 'Livechat_agent_leave_action_timeout' }, {
				$set: {
					value: timeout.value,
					type: 'int',
					group: 'Livechat'
				}
			});
		}

		RocketChat.models.Settings.remove({ _id: 'Livechat_forward_open_chats' });
		RocketChat.models.Settings.remove({ _id: 'Livechat_forward_open_chats_timeout' });
	}
});
