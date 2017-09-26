Meteor.methods({
	'livechat:saveAppearanceTexts'(settings) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveAppearanceTexts' });
		}

		const validSettings = [
			'Livechat_title',
			'Livechat_offline_form_unavailable',
			'Livechat_offline_message',
			'Livechat_offline_success_message',
			'Livechat_offline_title'
		];

		const valid = settings.every((setting) => {
			return validSettings.indexOf(setting.identifier) !== -1;
		});

		if (!valid) {
			throw new Meteor.Error('invalid-setting');
		}

		settings.forEach((setting) => {
			RocketChat.LivechatTexts.updateByNameAndLang(setting.identifier, setting.lang, setting.text);
		});

		return;
	}
});
