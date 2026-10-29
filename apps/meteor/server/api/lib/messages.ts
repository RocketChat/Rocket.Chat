import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { canAccessRoomAsync } from '../../lib/authorization/canAccessRoom';

async function getActivityRoomIds(uid: string): Promise<string[]> {
	const subscriptions = await Subscriptions.findByUserId(uid, { projection: { rid: 1, t: 1 } }).toArray();
	return subscriptions.filter(({ t }) => ['c', 'p', 'd'].includes(t)).map(({ rid }) => rid);
}

export async function findMentionedMessages({
	uid,
	roomId,
	pagination: { offset, count, sort },
}: {
	uid: string;
	roomId?: string;
	pagination: { offset: number; count: number; sort: FindOptions<IMessage>['sort'] };
}): Promise<{
	messages: IMessage[];
	count: number;
	offset: number;
	total: number;
}> {
	const user = await Users.findOneById<Pick<IUser, 'username'>>(uid, { projection: { username: 1 } });
	if (!user) {
		throw new Error('invalid-user');
	}

	const options = {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	};

	let result;
	if (roomId) {
		const room = await Rooms.findOneById(roomId);
		if (!room || !(await canAccessRoomAsync(room, { _id: uid }))) {
			throw new Error('error-not-allowed');
		}
		result = Messages.findPaginatedVisibleByMentionAndRoomId(user.username, roomId, options);
	} else {
		result = Messages.findPaginatedVisibleByMention(user.username, await getActivityRoomIds(uid), options);
	}
	const { cursor, totalCount } = result;

	const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		messages,
		count: messages.length,
		offset,
		total,
	};
}

export async function findStarredMessages({
	uid,
	roomId,
	pagination: { offset, count, sort },
}: {
	uid: string;
	roomId?: string;
	pagination: { offset: number; count: number; sort: FindOptions<IMessage>['sort'] };
}): Promise<{
	messages: IMessage[];
	count: number;
	offset: number;
	total: number;
}> {
	const user = await Users.findOneById<Pick<IUser, 'username'>>(uid, { projection: { username: 1 } });
	if (!user) {
		throw new Error('invalid-user');
	}

	const options = {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	};

	let result;
	if (roomId) {
		const room = await Rooms.findOneById(roomId);
		if (!room || !(await canAccessRoomAsync(room, { _id: uid }))) {
			throw new Error('error-not-allowed');
		}
		result = Messages.findStarredByUserAtRoom(uid, roomId, options);
	} else {
		result = Messages.findStarredByUser(uid, await getActivityRoomIds(uid), options);
	}
	const { cursor, totalCount } = result;

	const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		messages,
		count: messages.length,
		offset,
		total,
	};
}

export async function findDiscussionsFromRoom({
	uid,
	roomId,
	text,
	pagination: { offset, count, sort },
}: {
	uid: string;
	roomId: string;
	text: string;
	pagination: { offset: number; count: number; sort: FindOptions<IMessage>['sort'] };
}): Promise<{
	messages: IMessage[];
	count: number;
	offset: number;
	total: number;
}> {
	const room = await Rooms.findOneById(roomId);

	if (!room || !(await canAccessRoomAsync(room, { _id: uid }))) {
		throw new Error('error-not-allowed');
	}

	const { cursor, totalCount } = await Messages.findDiscussionsByRoomAndText(roomId, text, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		messages,
		count: messages.length,
		offset,
		total,
	};
}
