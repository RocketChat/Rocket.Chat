import { Rooms } from '@rocket.chat/models';

import { Users } from '../../../../models/server';
import { sendMessage, createDirectRoom } from '../../../../lib/server';
/*
 *
 * Get direct chat room helper
 *
 *
 */
const getDirectRoom = async (source, target) => {
	const uids = [source._id, target._id];
	const { _id, ...extraData } = await createDirectRoom([source, target]);

	const room = await Rooms.findOneDirectRoomContainingAllUserIDs(uids);
	if (room) {
		return {
			t: 'd',
			...room,
		};
	}

	return {
		_id,
		t: 'd',
		...extraData,
	};
};

export default async function handleSentMessage(args) {
	const user = Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		throw new Error(`Could not find a user with nick ${args.nick}`);
	}

	let room;

	if (args.roomName) {
		room = await Rooms.findOneByName(args.roomName);
	} else {
		const recipientUser = Users.findOne({
			'profile.irc.nick': args.recipientNick,
		});

		room = await getDirectRoom(user, recipientUser);
	}

	const message = {
		msg: args.message,
		ts: new Date(),
	};

	await sendMessage(user, message, room);
}
