import { Users, Rooms } from '@rocket.chat/models';

import { removeUserFromRoom } from '../../../../lib/server/functions/removeUserFromRoom';

export default async function handleLeftChannel(args) {
	const user = await Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		throw new Error(`Could not find a user with nick ${args.nick}`);
	}

	const room = await Rooms.findOneByName(args.roomName);

	if (!room) {
		throw new Error(`Could not find a room with name ${args.roomName}`);
	}

	this.log(`${user.username} left room ${room.name}`);
	await removeUserFromRoom(room._id, user);
}
