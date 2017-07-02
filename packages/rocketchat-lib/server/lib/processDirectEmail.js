import moment from 'moment';
const reply = require('emailreplyparser').EmailReplyParser;

RocketChat.processDirectEmail = function(email) {
	function sendMessage(email) {
		console.log(email);
		let message = {
			ts: email.headers.date,
			msg: email.body
		};

		if (message.ts) {
			const tsDiff = Math.abs(moment(message.ts).diff());
			if (tsDiff > 60000) {
				throw new Meteor.Error('error-message-ts-out-of-sync', 'Message timestamp is out of sync', {
					method: 'sendMessage',
					message_ts: message.ts,
					server_ts: new Date().getTime()
				});
			} else if (tsDiff > 10000) {
				message.ts = new Date();
			}
		} else {
			message.ts = new Date();
		}
		if (message.msg && message.msg.length > RocketChat.settings.get('Message_MaxAllowedSize')) {
			throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
				method: 'sendMessage'
			});
		}

		const user = RocketChat.models.Users.findOneByEmailAddress(email.headers.from, {
			fields: {
				username: 1,
				name: 1
			}
		});
		if (!user) {
			return false;
		}
	}

	// Extract/parse reply from email body
	email.body = reply.parse_reply(email.body);

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
