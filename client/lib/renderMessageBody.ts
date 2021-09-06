import { escapeHTML } from '@rocket.chat/string-helpers';

import { callbacks } from '../../app/callbacks/lib/callbacks';
import { IMessage } from '../../definition/IMessage';
import { ITask } from '../../definition/ITask';

export const renderMessageBody = <
	T extends Partial<ITask & IMessage> & { html?: string; title?: string },
>(
	message: T,
): string => {
	message.msg && (message.html = message.msg?.trim() ? escapeHTML(message.msg.trim()) : '');
	message.title && (message.html = message.title?.trim() ? escapeHTML(message.title.trim()) : '');
	const { tokens, html } = callbacks.run('renderMessage', message);

	return (Array.isArray(tokens) ? tokens.reverse() : []).reduce(
		(html, { token, text }) => html.replace(token, () => text),
		html,
	);
};
