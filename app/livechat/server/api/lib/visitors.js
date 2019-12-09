import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatVisitors, Messages, LivechatRooms, Subscriptions } from '../../../../models/server/raw';

export async function findVisitorInfo({ userId, visitorId }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const visitor = await LivechatVisitors.findOneById(visitorId);
	if (!visitor) {
		throw new Error('visitor-not-found');
	}

	return {
		visitor,
	};
}

export async function findVisitedPages({ userId, roomId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}
	const cursor = await Messages.findByRoomIdAndType(room._id, 'livechat_navigation_history', {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const pages = await cursor.toArray();

	return {
		pages,
		count: pages.length,
		offset,
		total,
	};
}

export async function findChatHistory({ userId, roomId, visitorId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}
	const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } });
	if (!subscription) {
		throw new Error('invalid-room');
	}

	const cursor = await LivechatRooms.findByVisitorId(visitorId, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const history = await cursor.toArray();

	return {
		history,
		count: history.length,
		offset,
		total,
	};
}
