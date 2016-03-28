/* global renderMessageBody:true */
/* exported renderMessageBody */

renderMessageBody = function(msg) {
	var message;

	msg.html = msg.msg;

	if (_.trim(msg.html) !== '') {
		msg.html = _.escapeHTML(msg.html);
	}

	message = RocketChat.callbacks.run('renderMessage', msg);

	if (message.tokens && message.tokens.length > 0) {
		for (var i = 0, len = message.tokens.length; i < len; i++) {
			let token = message.tokens[i];
			token.text = token.text.replace(/([^\$])(\$[^\$])/gm, '$1$$$2');
			message.html = message.html.replace(token.token, token.text);
		}
	}

	msg.html = message.html.replace(/\n/gm, '<br/>');

	return msg.html;
};
