import { Users, Rooms } from '@rocket.chat/models';

import { addUserToRoom } from '../../../../lib/server/functions/addUserToRoom';
import { createRoom } from '../../../../lib/server/functions/createRoom';

// TODO doesn't seem to be used anywhere, remove
export default async function handleJoinedChannel(args) {
	const user = await Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		throw new Error(`Could not find a user with nick ${args.nick}`);
	}

	let room = await Rooms.findOneByName(args.roomName);

	if (!room) {
		const createdRoom = await createRoom('c', args.roomName, user.username, []);
		room = await Rooms.findOne({ _id: createdRoom.rid });

		this.log(`${user.username} created room ${args.roomName}`);
	} else {
		await addUserToRoom(room._id, user);

		this.log(`${user.username} joined room ${room.name}`);
	}
}
