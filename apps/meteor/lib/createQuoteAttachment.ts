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
		// Identity of the quoted message, so clients can tell whether a deletion in its room applies
		// to it. `pinned` is normalised to a boolean: `undefined` then means "quote stored before
		// these fields existed", which is distinct from "known to be unpinned".
		rid: message.rid,
		pinned: Boolean(message.pinned),
		...(message.drid && { drid: message.drid }),
	};
}
