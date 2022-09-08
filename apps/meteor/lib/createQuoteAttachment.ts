import type { ITranslatedMessage } from '@rocket.chat/core-typings';

import { getUserAvatarURL } from '../app/utils/lib/getUserAvatarURL';

export function createQuoteAttachment(message: ITranslatedMessage, messageLink: string) {
	return {
		text: message.msg,
		translations: message?.translations,
		message_link: messageLink,
		author_name: message.alias || message.u.username,
		author_icon: getUserAvatarURL(message.u.username),
		attachments: message.attachments || [],
		ts: message.ts,
	};
}
