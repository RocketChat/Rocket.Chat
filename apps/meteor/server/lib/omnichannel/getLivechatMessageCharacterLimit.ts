import { settings } from '../../settings';

// The longest Livechat message a visitor may send, matching the limit announced to the widget
export const getLivechatMessageCharacterLimit = (): number | undefined => {
	if (!settings.get('Livechat_enable_message_character_limit')) {
		return undefined;
	}

	return parseInt(settings.get('Livechat_message_character_limit')) || settings.get<number>('Message_MaxAllowedSize');
};
