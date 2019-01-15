import { callbacks } from 'meteor/rocketchat:callbacks';
import s from 'underscore.string';

export const renderMessageBody = (msg) => {
	msg.html = msg.msg;

	if (s.trim(msg.html) !== '') {
		msg.html = s.escapeHTML(msg.html);
	}

	const message = callbacks.run('renderMessage', msg);

	if (message.tokens && message.tokens.length > 0) {
		// Unmounting tokens(LIFO)
		for (const { token, text } of message.tokens.reverse()) {
			message.html = message.html.replace(token, () => text); // Uses lambda so doesn't need to escape $
		}
	}

	return msg.html;
};
