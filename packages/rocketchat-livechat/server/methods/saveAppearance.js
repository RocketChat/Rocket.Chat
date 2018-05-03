Meteor.methods({
	'livechat:saveAppearance'(settings) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveAppearance' });
		}

		const validSettings = [
			'Livechat_title',
			'Livechat_title_color',
			'Livechat_show_agent_email',
			'Livechat_display_offline_form',
			'Livechat_offline_form_unavailable',
			'Livechat_offline_message',
			'Livechat_offline_success_message',
			'Livechat_offline_title',
			'Livechat_offline_title_color',
			'Livechat_offline_email',
			'Livechat_conversation_finished_message'
		];

		const valid = settings.every((setting) => {
			return validSettings.indexOf(setting._id) !== -1;
		});

		if (!valid) {
			throw new Meteor.Error('invalid-setting');
		}

		settings.forEach((setting) => {
			RocketChat.settings.updateById(setting._id, setting.value);
		});

		return;
	}
});
