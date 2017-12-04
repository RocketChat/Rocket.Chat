import s from 'underscore.string';

Meteor.methods({
	'livechat:saveIntegration'(values) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveIntegration' });
		}

		if (typeof values['Livechat_webhookUrl'] !== 'undefined') {
			RocketChat.settings.updateById('Livechat_webhookUrl', s.trim(values['Livechat_webhookUrl']));
		}

		if (typeof values['Livechat_secret_token'] !== 'undefined') {
			RocketChat.settings.updateById('Livechat_secret_token', s.trim(values['Livechat_secret_token']));
		}

		if (typeof values['Livechat_webhook_on_close'] !== 'undefined') {
			RocketChat.settings.updateById('Livechat_webhook_on_close', !!values['Livechat_webhook_on_close']);
		}

		if (typeof values['Livechat_webhook_on_offline_msg'] !== 'undefined') {
			RocketChat.settings.updateById('Livechat_webhook_on_offline_msg', !!values['Livechat_webhook_on_offline_msg']);
		}

		return;
	}
});
