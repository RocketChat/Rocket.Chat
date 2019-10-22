import { canAccessRoomAsync } from '../../../authorization/server/functions/canAccessRoom';
import { Rooms, Messages, Users } from '../../../models/server/raw';

export async function findMentionedMessages({ uid, roomId, pagination: { offset, count, sort } }) {
	const room = await Rooms.findOneById(roomId);
	if (!await canAccessRoomAsync(room, { _id: uid })) {
		throw new Error('error-not-allowed');
	}
	const user = await Users.findOneById(uid, { fields: { username: 1 } });
	if (!user) {
		throw new Error('invalid-user');
	}

	const cursor = await Messages.findVisibleByMentionAndRoomId(user.username, roomId, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const messages = await cursor.toArray();

	return {
		messages,
		count: messages.length,
		offset,
		total,
	};
}

export async function findStarredMessages({ uid, roomId, pagination: { offset, count, sort } }) {
	const room = await Rooms.findOneById(roomId);
	if (!await canAccessRoomAsync(room, { _id: uid })) {
		throw new Error('error-not-allowed');
	}
	const user = await Users.findOneById(uid, { fields: { username: 1 } });
	if (!user) {
		throw new Error('invalid-user');
	}

	const cursor = await Messages.findStarredByUserAtRoom(uid, roomId, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const messages = await cursor.toArray();

	return {
		messages,
		count: messages.length,
		offset,
		total,
	};
}
