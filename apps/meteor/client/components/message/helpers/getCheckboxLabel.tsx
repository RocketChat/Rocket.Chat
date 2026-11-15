import type { IMessage } from '@rocket.chat/core-typings';
import type { TFunction } from 'i18next';

export const getCheckboxLabel = (message: IMessage, t: TFunction): string => {
	const username = message.u.name || message.u.username;
	if (message.msg) {
		return t('Select_message_from_user_with_preview', {
			username,
			message: message.msg,
		});
	}
	return t('Select_message_from_user', { username });
};
