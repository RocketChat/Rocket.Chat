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
		...(message.md && { md: message.md }),
		...(isTranslatedMessage(message) && { translations: message?.translations }),
		message_link: messageLink,
		author_name: message.alias || getUserDisplayName(message.u.name, message.u.username, useRealName),
		author_icon: userAvatarUrl,
		attachments: message.attachments || [],
		ts: message.ts,
		// Room of the quoted message, so a client can watch it for deletions even when the quote is
		// rendered elsewhere. Only immutable identity is stored: `pinned` and `drid` can change after
		// the quote is saved and nothing refreshes the stored attachment, so a snapshot of them here
		// would go stale silently.
		rid: message.rid,
	};
}
