import { Users, Rooms } from '@rocket.chat/models';

import { createDirectRoom } from '../../../../lib/server/functions/createDirectRoom';
import { sendMessage } from '../../../../lib/server/functions/sendMessage';

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
	const user = await Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		throw new Error(`Could not find a user with nick ${args.nick}`);
	}

	let room;

	if (args.roomName) {
		room = await Rooms.findOneByName(args.roomName);
	} else {
		const recipientUser = await Users.findOne({
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
