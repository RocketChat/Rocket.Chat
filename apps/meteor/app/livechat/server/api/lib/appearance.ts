import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

export async function findAppearance(): Promise<{ appearance: ISetting[] }> {
	const query = {
		_id: {
			$in: [
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
				'Livechat_registration_form',
				'Livechat_name_field_registration_form',
				'Livechat_email_field_registration_form',
				'Livechat_registration_form_message',
				'Livechat_conversation_finished_text',
			],
		},
	};

	return {
		appearance: await Settings.find(query).toArray(),
	};
}
