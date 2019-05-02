import { Meteor } from 'meteor/meteor';
import { settings } from '../../../settings';
import { Rooms, Messages, Users, Subscriptions } from '../../../models';
import { metrics } from '../../../metrics';
import { EmailReplyParser as reply } from 'emailreplyparser';
import { sendMessage as _sendMessage } from '../functions';
import moment from 'moment';

export const processDirectEmail = function(email) {
	function sendMessage(email) {
		const message = {
			ts: new Date(email.headers.date),
			msg: email.body,
			sentByEmail: true,
			groupable: false,
		};

		if (message.ts) {
			const tsDiff = Math.abs(moment(message.ts).diff());
			if (tsDiff > 10000) {
				message.ts = new Date();
			}
		} else {
			message.ts = new Date();
		}

		if (message.msg && message.msg.length > settings.get('Message_MaxAllowedSize')) {
			return false;
		}

		// reduce new lines in multiline message
		message.msg = message.msg.split('\n\n').join('\n');

		const user = Users.findOneByEmailAddress(email.headers.from, {
			fields: {
				username: 1,
				name: 1,
			},
		});
		if (!user) {
			// user not found
			return false;
		}

		const prevMessage = Messages.findOneById(email.headers.mid, {
			rid: 1,
			u: 1,
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

		const roomInfo = Rooms.findOneById(message.rid, {
			t: 1,
			name: 1,
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

		const subscription = Subscriptions.findOneByRoomIdAndUserId(message.rid, user._id);
		if (subscription && (subscription.blocked || subscription.blocker)) {
			// room is blocked
			return false;
		}

		if ((room.muted || []).includes(user.username)) {
			// room is muted
			return false;
		}

		if (message.alias == null && settings.get('Message_SetNameToAliasEnabled')) {
			message.alias = user.name;
		}

		metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736

		return _sendMessage(user, message, room);
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

	if (settings.get('Direct_Reply_Method') && settings.get('Direct_Reply_Method') === 'subject') {
		// message id to reply to is encoded by email 'subject'
		const ind = email.headers.subject.indexOf('reply:');
		if (ind > 0) {
			email.headers.mid = email.headers.subject.substring(ind + 6, ind + 23);
		}
	} else if (settings.get('Direct_Reply_Method') && settings.get('Direct_Reply_Method') === 'to') {
		// message id to reply to is encoded by email 'to'
		// 'To' email format "username+messageId@domain"
		if (email.headers.to.indexOf('+') >= 0) {
			// Valid 'To' format
			email.headers.mid = email.headers.to.split('@')[0].split('+')[1];
		}
	}
	if (email.headers.mid) {
		return sendMessage(email);
	} else {
		console.log('Invalid Email....If not. Please report it.');
		return false;
	}
};
