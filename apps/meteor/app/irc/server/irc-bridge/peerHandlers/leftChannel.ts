import { Users, Rooms } from '@rocket.chat/models';

import { removeUserFromRoom } from '../../../../lib/server/functions/removeUserFromRoom';

type LeftChannelArgs = {
	nick: string;
	roomName: string;
};

export default async function handleLeftChannel(this: any, args: LeftChannelArgs): Promise<void> {
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
