/* global renderMessageBody:true */

renderMessageBody = function(msg) {
	var message;

	msg.html = msg.msg;

	if (_.trim(msg.html) !== '') {
		msg.html = _.escapeHTML(msg.html);
	}

	message = RocketChat.callbacks.run('renderMessage', msg);

	if (message.tokens && message.tokens.length > 0) {
		for (const {token, text} of message.tokens) {
			message.html = message.html.replace(token, () => text); // Uses lambda so doesn't need to escape $
		}
	}

	msg.html = message.html.replace(/\n/gm, '<br/>');

	return msg.html;
};

/* exported renderMessageBody */
