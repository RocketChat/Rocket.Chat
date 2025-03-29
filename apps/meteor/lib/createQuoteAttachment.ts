import { isTranslatedMessage, getUserDisplayName } from '@rocket.chat/core-typings';
import type { ITranslatedMessage, IMessage } from '@rocket.chat/core-typings';

export function createQuoteAttachment(
	message: IMessage | ITranslatedMessage,
	messageLink: string,
	useRealName: boolean,
	userAvatarUrl: string,
) {
	return {
		text: message.msg,
		md: message.md,
		...(isTranslatedMessage(message) && { translations: message?.translations }),
		message_link: messageLink,
		author_name: message.alias || getUserDisplayName(message.u.name, message.u.username, useRealName),
		author_icon: userAvatarUrl,
		attachments: message.attachments || [],
		ts: message.ts,
	};
}
