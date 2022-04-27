import { escapeHTML } from '@rocket.chat/string-helpers';

import { IMessage } from '../../../definition/IMessage';
import { callbacks } from '../../../lib/callbacks';

export const renderMessageBody = <T extends Partial<IMessage> & { tokens?: { token: string; text: string }[]; html?: string }>(
	message: T,
): string => {
	message.html = message.msg?.trim() ? escapeHTML(message.msg.trim()) : '';

	const { tokens, html } = callbacks.run('renderMessage', message);

	return (Array.isArray(tokens) ? tokens.reverse() : []).reduce((html, { token, text }) => html.replace(token, () => text), html ?? '');
};
