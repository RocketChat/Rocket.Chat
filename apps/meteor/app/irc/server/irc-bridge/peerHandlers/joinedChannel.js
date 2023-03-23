import { Users, Rooms } from '../../../../models/server';
import { createRoom, addUserToRoom } from '../../../../lib/server';

// TODO doesn't seem to be used anywhere, remove
export default async function handleJoinedChannel(args) {
	const user = Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		throw new Error(`Could not find a user with nick ${args.nick}`);
	}

	let room = Rooms.findOneByName(args.roomName);

	if (!room) {
		const createdRoom = await createRoom('c', args.roomName, user.username, []);
		room = Rooms.findOne({ _id: createdRoom.rid });

		this.log(`${user.username} created room ${args.roomName}`);
	} else {
		await addUserToRoom(room._id, user);

		this.log(`${user.username} joined room ${room.name}`);
	}
}
