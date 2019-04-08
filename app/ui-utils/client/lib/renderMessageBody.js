import { callbacks } from '../../../callbacks';
import s from 'underscore.string';

export const renderMessageBody = (message) => {
	message.html = s.trim(message.msg) ? s.escapeHTML(message.msg) : '';

	const { tokens, html } = callbacks.run('renderMessage', message);

	return (Array.isArray(tokens) ? tokens.reverse() : [])
		.reduce((html, { token, text }) => html.replace(token, () => text), html);
};
