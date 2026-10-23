import { settings } from '../../settings';

// The longest Livechat message a visitor may send, matching the limit announced to the widget
export const getLivechatMessageCharacterLimit = (): number | undefined => {
	if (!settings.get('Livechat_enable_message_character_limit')) {
		return undefined;
	}

	const configuredLimit = parseInt(settings.get('Livechat_message_character_limit'));
	return configuredLimit > 0 ? configuredLimit : settings.get<number>('Message_MaxAllowedSize');
};
