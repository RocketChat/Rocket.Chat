import type { IMessage } from '@rocket.chat/core-typings';
import { Messages, Subscriptions, Users, Rooms } from '@rocket.chat/models';
import type { ParsedMail } from 'mailparser';
import moment from 'moment';

import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';
import { sendMessage } from '../functions/sendMessage';

const isParsedEmail = (email: ParsedMail): email is Required<ParsedMail> => 'date' in email && 'html' in email;

export const processDirectEmail = async function (email: ParsedMail): Promise<void> {
	if (!isParsedEmail(email)) {
		return;
	}

	const to = Array.isArray(email.to) ? email.to.find((email) => email.text) : email.to;
	const mid = to?.text.split('@')[0].split('+')[1];

	if (!mid) {
		return;
	}

	const ts = new Date(email.date);

	const tsDiff = Math.abs(moment(ts).diff(new Date()));

	let msg = email.text.split('\n\n').join('\n');

	if (msg && msg.length > (settings.get('Message_MaxAllowedSize') as number)) {
		return;
	}
	const emailAdress = email.from.value[0].address;
	if (!emailAdress) {
		return;
	}

	const user = await Users.findOneByEmailAddress(emailAdress, {
		projection: {
			username: 1,
			name: 1,
		},
	});

	if (!user?.username) {
		// user not found
		return;
	}

	const prevMessage = await Messages.findOneById(mid, {
		rid: 1,
		u: 1,
	});

	if (!prevMessage) {
		// message doesn't exist anymore
		return;
	}

	const roomInfo = await Rooms.findOneById(prevMessage.rid);

	if (!roomInfo) {
		// room doesn't exist anymore
		return;
	}

	const room = await canAccessRoomAsync(roomInfo, user);
	if (!room) {
		return;
	}

	// check mention
	if (msg.indexOf(`@${prevMessage.u.username}`) === -1 && roomInfo.t !== 'd') {
		msg = `@${prevMessage.u.username} ${msg}`;
	}

	// reply message link WE HA THREADS KNOW DONT NEED TO QUOTE THE previous message
	// let prevMessageLink = `[ ](${ Meteor.absoluteUrl().replace(/\/$/, '') }`;
	// if (roomInfo.t === 'c') {
	// 	prevMessageLink += `/channel/${ roomInfo.name }?msg=${ mid }) `;
	// } else if (roomInfo.t === 'd') {
	// 	prevMessageLink += `/direct/${ prevMessage.u.username }?msg=${ mid }) `;
	// } else if (roomInfo.t === 'p') {
	// 	prevMessageLink += `/group/${ roomInfo.name }?msg=${ mid }) `;
	// }
	// // add reply message link
	// msg = prevMessageLink + msg;

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(prevMessage.rid, user._id);
	if (subscription && (subscription.blocked || subscription.blocker)) {
		// room is blocked
		return;
	}

	if ((roomInfo.muted || []).includes(user.username || '')) {
		// user is muted
		return;
	}

	// room is readonly
	if (roomInfo.ro === true) {
		if (!(await hasPermissionAsync(user._id, 'post-readonly', roomInfo._id))) {
			// Check if the user was manually unmuted
			if (!(roomInfo.unmuted || []).includes(user.username || '')) {
				return;
			}
		}
	}

	metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736

	const message: Pick<IMessage, 'ts' | 'msg' | 'groupable' | 'rid' | 'sentByEmail' | 'tmid'> = {
		ts: tsDiff < 10000 ? ts : new Date(),
		msg,
		sentByEmail: true,
		groupable: false,
		tmid: mid,
		rid: prevMessage.rid,
	};

	return sendMessage(user, message, roomInfo);
};
