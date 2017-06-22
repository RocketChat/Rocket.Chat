const reply = require('emailreplyparser').EmailReplyParser;

RocketChat.processDirectEmail = function(email) {
	email.body = reply.parse_reply(email.body);
	console.log(email);

	email.headers.to = email.headers.to[0];

	email.headers.from = email.headers.from[0];

	if (email.headers.from.indexOf('<') >= 0 && email.headers.from.indexOf('>') >= 0) {
		email.headers.from = email.headers.from.split('<')[1];
		email.headers.from = email.headers.from.split('>')[0];
	}

	email.headers.references = email.headers.references[0].split('@')[0];
	email.headers.date = email.headers.date[0];

	if (email.headers.references.charAt(0) === '<') {
		email.headers.references = email.headers.references.substr(1);
	}
	console.log(email);

	const validEmail = /^[0-9]+\+([0-9]|[a-z]|[A-Z])+\+([0-9]|[a-z]|[A-Z])+$/;

	if (validEmail.test(email.headers.references)) {
		console.log('Valid Email');
		email.headers.rid = email.headers.references.split('+')[1];
		email.headers.mid = email.headers.references.split('+')[2];
	} else {
		console.log('Invalid Email....');
	}
};
