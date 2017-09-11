import {EmailReplyParser as reply} from 'emailreplyparser';
import moment from 'moment';

RocketChat.processDirectEmail = function(email) {
	function sendMessage(email) {
		const message = {
			ts: new Date(email.headers.date),
			msg: email.body,
			sentByEmail: true,
			groupable: false
		};

		if (message.ts) {
			const tsDiff = Math.abs(moment(message.ts).diff());
			if (tsDiff > 10000) {
				message.ts = new Date();
			}
		} else {
			message.ts = new Date();
		}

		if (message.msg && message.msg.length > RocketChat.settings.get('Message_MaxAllowedSize')) {
			return false;
		}

		// reduce new lines in multiline message
		message.msg = message.msg.split('\n\n').join('\n');

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

		const roomInfo = RocketChat.models.Rooms.findOneById(message.rid, {
			t: 1,
			name: 1
		});

		// check mention
		if (message.msg.indexOf(`@${ prevMessage.u.username }`) === -1 && roomInfo.t !== 'd') {
			message.msg = `@${ prevMessage.u.username } ${ message.msg }`;
		}

		// reply message link
		let prevMessageLink = `[ ](${ Meteor.absoluteUrl().replace(/\/$/, '') }`;
		if (roomInfo.t === 'c') {
			prevMessageLink += `/channel/${ roomInfo.name }?msg=${ email.headers.mid }) `;
		} else if (roomInfo.t === 'd') {
			prevMessageLink += `/direct/${ prevMessage.u.username }?msg=${ email.headers.mid }) `;
		} else if (roomInfo.t === 'p') {
			prevMessageLink += `/group/${ roomInfo.name }?msg=${ email.headers.mid }) `;
		}
		// add reply message link
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

	// if 'To' email format is "Name <username@domain>"
	if (email.headers.to.indexOf('<') >= 0 && email.headers.to.indexOf('>') >= 0) {
		email.headers.to = email.headers.to.split('<')[1].split('>')[0];
	}

	// if 'From' email format is "Name <username@domain>"
	if (email.headers.from.indexOf('<') >= 0 && email.headers.from.indexOf('>') >= 0) {
		email.headers.from = email.headers.from.split('<')[1].split('>')[0];
	}

	// 'To' email format "username+messageId@domain"
	if (email.headers.to.indexOf('+') >= 0) {
		// Valid 'To' format
		email.headers.mid = email.headers.to.split('@')[0].split('+')[1];
		sendMessage(email);
	} else {
		console.log('Invalid Email....If not. Please report it.');
	}
};
