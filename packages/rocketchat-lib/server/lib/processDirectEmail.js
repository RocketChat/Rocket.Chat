import moment from 'moment';
const reply = require('emailreplyparser').EmailReplyParser;

RocketChat.processDirectEmail = function(email) {
	function sendMessage(email) {
		console.log(email);
		let message = {
			ts: new Date(email.headers.date),
			msg: email.body
		};

		if (!message.ts) {
			message.ts = new Date();
		}

		if (message.msg && message.msg.length > RocketChat.settings.get('Message_MaxAllowedSize')) {
			return false;
		}

		const user = RocketChat.models.Users.findOneByEmailAddress(email.headers.from, {
			fields: {
				username: 1,
				name: 1
			}
		});
		if (!user) {
			// user not found
			return false;
		}

		const prevMessage = RocketChat.models.Messages.findOneById(email.headers.mid, {
			rid: 1,
			u: 1
		});
		if (!prevMessage) {
			// message doesn't exist anymore
			return false;
		}
		message.rid = prevMessage.rid;

		const room = Meteor.call('canAccessRoom', message.rid, user._id);
		if (!room) {
			return false;
		}

		// check mention
		if (message.msg.indexOf('@' + prevMessage.u.username) === -1) {
			message.msg = '@' + prevMessage.u.username + ' ' + message.msg;
		}

		const roomInfo = RocketChat.models.Rooms.findOneByIdOrName(message.rid, {
			t: 1,
			name: 1,
			ro: 1
		});

		// reply message link
		let prevMessageLink = `[ ](${ Meteor.absoluteUrl().replace(/\/$/, '') }`;
		if (roomInfo.t == "c") {
			prevMessageLink += `/channel/${ roomInfo.name }?msg=${ email.headers.mid }) `;
		} else if (roomInfo.t == "d") {
			prevMessageLink += `/direct/${ user.username }?msg=${ email.headers.mid }) `;
		} else if (roomInfo.t == "p") {
			prevMessageLink += `/group/${ roomInfo.name }?msg=${ email.headers.mid }) `;
		}

		message.msg = prevMessageLink + message.msg;

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, user._id);
		if (subscription && subscription.blocked || subscription.blocker) {
			// room is blocked
			return false;
		}

		if ((room.muted || []).includes(user.username)) {
			// room is muted
			return false;
		}

		if (message.alias == null && RocketChat.settings.get('Message_SetNameToAliasEnabled')) {
			message.alias = user.name;
		}

		RocketChat.metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736

		return RocketChat.sendMessage(user, message, room);
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
