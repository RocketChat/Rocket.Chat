import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { EmailReplyParser as reply } from 'emailreplyparser';
import moment from 'moment';
import base64 from 'base-64';
import utf8 from 'utf8';

import { settings } from '../../../settings';
import { Rooms, Messages, Users, Subscriptions } from '../../../models';
import { metrics } from '../../../metrics';
import { hasPermission } from '../../../authorization';
import { sendMessage as _sendMessage } from '../functions';

export const processDirectEmail = function(email) {
	function _getMessage(email, userName, roomId) {
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

		// the message might be base64 encoded, try to decode
		try {
			const bytes = base64.decode(message.msg);
			message.msg = utf8.decode(bytes);
		} catch (e) {
			// decoding the message has faild, take the original message
		}

		if (message.alias == null && settings.get('Message_SetNameToAliasEnabled')) {
			message.alias = userName;
		}

		message.rid = roomId;
		return message;
	}

	function _getUserByEmailaddress(emailaddress) {
		const user = Users.findOneByEmailAddress(emailaddress, {
			fields: {
				username: 1,
				name: 1,
			},
		});
		return user;
	}

	function _canWriteToRoom(roomId, user) {
		const room = Meteor.call('canAccessRoom', roomId, user._id);
		if (!room) { return false; }

		const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
		if (subscription && (subscription.blocked || subscription.blocker)) {
			// room is blocked
			return false;
		}

		if ((room.muted || []).includes(user.username)) {
			// user is muted
			return false;
		}

		// room is readonly
		if (room.ro === true) {
			if (!hasPermission(Meteor.userId(), 'post-readonly', room._id)) {
				// Check if the user was manually unmuted
				if (!(room.unmuted || []).includes(user.username)) {
					return false;
				}
			}
		}
		return room;
	}

	/**
	 * Creates a new message and sends it to the referenced room
	 *
	 * @param {*} email
	 */
	function createMessage(email) {
		// get user
		const user = _getUserByEmailaddress(email.headers.from);
		if (!user) { return false; }

		// check room
		let room = Rooms.findOneByNameAndType(email.headers.room, 'c');
		if (!room) {
			room = Rooms.createWithIdTypeAndName(Random.id(), 'c', email.headers.room);
		}
		if (!Subscriptions.findOneByRoomIdAndUserId(room._id, user._id)) {
			Subscriptions.createWithRoomAndUser(room, user, {
				ts: new Date(),
				open: true,
				alert: true,
				unread: 1,
				userMentions: 1,
				groupMentions: 0,
			});
		}
		room = _canWriteToRoom(room._id, user);
		if (!room) { return false; }

		// create message
		const message = _getMessage(email, user.name, room._id);
		if (!message) { return false; }

		// send message
		metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736
		return _sendMessage(user, message, room);
	}

	/**
	 * Creates a new message and replies to the referenced message
	 * @param {*} email
	 */
	function sendMessage(email) {
		// get user
		const user = _getUserByEmailaddress(email.headers.from);
		if (!user) { return false; }

		// get prev messsage
		const prevMessage = Messages.findOneById(email.headers.mid, {
			rid: 1,
			u: 1,
		});
		if (!prevMessage) { return false; }

		// check room
		const room = _canWriteToRoom(prevMessage.rid, user);
		if (!room) { return false; }

		// create message
		const message = _getMessage(email, user.name, room._id);
		if (!message) { return false; }

		// add reply info
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

	const roomIdx = email.headers.subject.indexOf('room:');
	if (roomIdx > 0) {
		// message id to reply to is encoded by email 'subject'
		email.headers.room = email.headers.subject.substring(roomIdx + 5, email.headers.subject.length);
	}
	if (email.headers.room) {
		return createMessage(email);
	}

	const replyIdx = email.headers.subject.indexOf('reply:');
	if (replyIdx > 0) {
		// message id to reply to is encoded by email 'subject'
		email.headers.mid = email.headers.subject.substring(replyIdx + 6, replyIdx + 23);
	} else if (email.headers.to.indexOf('+') >= 0) {
		// message id to reply to is encoded by email 'to'
		// Valid 'To' format
		email.headers.mid = email.headers.to.split('@')[0].split('+')[1];
	}
	if (email.headers.mid) {
		return sendMessage(email);
	}
	console.log('Invalid Email....If not. Please report it.');
	return false;
};
