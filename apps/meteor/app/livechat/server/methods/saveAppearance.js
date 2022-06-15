import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Settings } from '../../../models/server';

Meteor.methods({
	'livechat:saveAppearance'(settings) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveAppearance',
			});
		}

		const validSettings = [
			'Livechat_title',
			'Livechat_title_color',
			'Livechat_enable_message_character_limit',
			'Livechat_message_character_limit',
			'Livechat_show_agent_info',
			'Livechat_show_agent_email',
			'Livechat_display_offline_form',
			'Livechat_offline_form_unavailable',
			'Livechat_offline_message',
			'Livechat_offline_success_message',
			'Livechat_offline_title',
			'Livechat_offline_title_color',
			'Livechat_offline_email',
			'Livechat_conversation_finished_message',
			'Livechat_conversation_finished_text',
			'Livechat_registration_form',
			'Livechat_name_field_registration_form',
			'Livechat_email_field_registration_form',
			'Livechat_registration_form_message',
		];

		const valid = settings.every((setting) => validSettings.indexOf(setting._id) !== -1);

		if (!valid) {
			throw new Meteor.Error('invalid-setting');
		}

		settings.forEach((setting) => {
			Settings.updateValueById(setting._id, setting.value);
		});
	},
});
