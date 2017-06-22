const reply = require('emailreplyparser').EmailReplyParser;

RocketChat.processDirectEmail = function(email) {
	email.reply = reply.parse_reply(email.body);
	console.log(email);
};
