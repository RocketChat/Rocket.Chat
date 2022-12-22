import type { IMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { filterMarkdown } from '../../app/markdown/lib/markdown';
import { renderMessageBody } from './utils/renderMessageBody';

export function normalizeThreadMessage({ ...message }: Readonly<Pick<IMessage, 'msg' | 'mentions' | 'attachments'>>): string | undefined {
	if (message.msg) {
		message.msg = filterMarkdown(message.msg);
		delete message.mentions;
		return renderMessageBody(message).replace(/<br\s?\\?>/g, ' ');
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment?.description) {
			return escapeHTML(attachment.description);
		}

		if (attachment?.title) {
			return escapeHTML(attachment.title);
		}
	}
}
