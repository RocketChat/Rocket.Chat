const reply = require('emailreplyparser').EmailReplyParser;

RocketChat.processDirectEmail = function(email) {
	function sendMessage(email) {
		console.log(email);
	}

	// Extract/parse reply from email body
	email.body = reply.parse_reply(email.body);
	console.log(email);

	email.headers.to = email.headers.to[0];

	// if 'To' email format is "Name <username@domain>"
	if (email.headers.to.indexOf('<') >= 0 && email.headers.to.indexOf('>') >= 0) {
		email.headers.to = email.headers.to.split('<')[1].split('>')[0];
	}

	email.headers.from = email.headers.from[0];

	// if 'From' email format is "Name <username@domain>"
	if (email.headers.from.indexOf('<') >= 0 && email.headers.from.indexOf('>') >= 0) {
		email.headers.from = email.headers.from.split('<')[1].split('>')[0];
	}

	email.headers.date = email.headers.date[0];

	email.headers.references = email.headers.references[0];

	// references format is "<imestamp+roomId+messageId@domain>"
	email.headers.references = email.headers.references.split('@')[0];
	if (email.headers.references.charAt(0) === '<') {
		email.headers.references = email.headers.references.substr(1);
	}

	// 'To' email format "username+messageId@domain"
	if (email.headers.to.indexOf('+') >= 0) {
		// Valid 'To' format
		console.log('Valid Email');
		email.headers.mid = email.headers.to.split('@')[0].split('+')[1];
		sendMessage(email);
	} else if (/^[0-9]+\+([0-9]|[a-z]|[A-Z])+\+([0-9]|[a-z]|[A-Z])+$/.test(email.headers.references)) {
		// Valid references(Message-ID) format
		console.log('Valid Email');
		email.headers.rid = email.headers.references.split('+')[1];
		email.headers.mid = email.headers.references.split('+')[2];
		sendMessage(email);
	} else {
		console.log('Invalid Email....If not. Please report it.');
	}
};
