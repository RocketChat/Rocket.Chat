import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../../authorization';
import { Settings } from '../../../models';

Meteor.publish('livechat:integration', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:integration' }));
	}

	if (!hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:integration' }));
	}

	const self = this;

	const handle = Settings.findByIds(['Livechat_webhookUrl', 'Livechat_secret_token', 'Livechat_webhook_on_close', 'Livechat_webhook_on_offline_msg', 'Livechat_webhook_on_visitor_message', 'Livechat_webhook_on_agent_message']).observeChanges({
		added(id, fields) {
			self.added('livechatIntegration', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatIntegration', id, fields);
		},
		removed(id) {
			self.removed('livechatIntegration', id);
		},
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
