import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Rooms, Messages, Users } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { canAccessRoomAsync } from '../../../authorization/server/functions/canAccessRoom';

export async function findMentionedMessages({
	uid,
	roomId,
	pagination: { offset, count, sort },
}: {
	uid: string;
	roomId: string;
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
	const user = await Users.findOneById<Pick<IUser, 'username'>>(uid, { projection: { username: 1 } });
	if (!user) {
		throw new Error('invalid-user');
	}

	const { cursor, totalCount } = Messages.findPaginatedVisibleByMentionAndRoomId(user.username, roomId, {
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

export async function findStarredMessages({
	uid,
	roomId,
	pagination: { offset, count, sort },
}: {
	uid: string;
	roomId: string;
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
	const user = await Users.findOneById<Pick<IUser, 'username'>>(uid, { projection: { username: 1 } });
	if (!user) {
		throw new Error('invalid-user');
	}

	const { cursor, totalCount } = Messages.findStarredByUserAtRoom(uid, roomId, {
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
