import { isTranslatedMessage } from '@rocket.chat/core-typings';
import type { ITranslatedMessage, IMessage } from '@rocket.chat/core-typings';

import { getUserAvatarURL } from '../app/utils/lib/getUserAvatarURL';
import { getUserDisplayName } from './getUserDisplayName';

export function createQuoteAttachment(message: IMessage | ITranslatedMessage, messageLink: string, useRealName: boolean) {
	return {
		text: message.msg,
		md: message.md,
		...(isTranslatedMessage(message) && { translations: message?.translations }),
		message_link: messageLink,
		author_name: message.alias || getUserDisplayName(message.u.name, message.u.username, useRealName),
		author_icon: getUserAvatarURL(message.u.username),
		attachments: message.attachments || [],
		ts: message.ts,
	};
}
