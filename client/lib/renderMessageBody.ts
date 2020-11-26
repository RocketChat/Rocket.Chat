import { escapeHTML } from '../../lib/escapeHTML';
import { callbacks } from '../../app/callbacks/lib/callbacks';
import { IMessage } from '../../definition/IMessage';

export const renderMessageBody = <T extends IMessage>(message: T & { html?: string }): string => {
	message.html = message.msg?.trim() ? escapeHTML(message.msg.trim()) : '';

	const { tokens, html } = callbacks.run('renderMessage', message);

	return (Array.isArray(tokens) ? tokens.reverse() : [])
		.reduce((html, { token, text }) => html.replace(token, () => text), html);
};
