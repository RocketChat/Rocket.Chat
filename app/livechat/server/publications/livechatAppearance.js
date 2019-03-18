import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../../authorization';
import { Settings } from '../../../models';

Meteor.publish('livechat:appearance', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:appearance' }));
	}

	if (!hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:appearance' }));
	}

	const query = {
		_id: {
			$in: [
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
				'Livechat_conversation_finished_message',
				'Livechat_registration_form',
				'Livechat_name_field_registration_form',
				'Livechat_email_field_registration_form',
				'Livechat_registration_form_message',
			],
		},
	};

	const self = this;

	const handle = Settings.find(query).observeChanges({
		added(id, fields) {
			self.added('livechatAppearance', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatAppearance', id, fields);
		},
		removed(id) {
			self.removed('livechatAppearance', id);
		},
	});

	this.ready();

	this.onStop(() => {
		handle.stop();
	});
});
