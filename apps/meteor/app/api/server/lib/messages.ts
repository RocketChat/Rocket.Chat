import type { FindOptions } from 'mongodb';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Rooms, Messages, Users } from '@rocket.chat/models';

import { canAccessRoomAsync } from '../../../authorization/server/functions/canAccessRoom';
import { getValue } from '../../../settings/server/raw';

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

	const { cursor, totalCount } = Messages.findVisibleByMentionAndRoomId(user.username, roomId, {
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
	offset: any;
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

export async function findSnippetedMessageById({ uid, messageId }: { uid: string; messageId: string }): Promise<IMessage> {
	if (!(await getValue('Message_AllowSnippeting'))) {
		throw new Error('error-not-allowed');
	}

	if (!uid) {
		throw new Error('invalid-user');
	}

	const snippet = await Messages.findOne({ _id: messageId, snippeted: true });

	if (!snippet) {
		throw new Error('invalid-message');
	}

	const room = await Rooms.findOneById(snippet.rid);

	if (!room) {
		throw new Error('invalid-message');
	}

	if (!(await canAccessRoomAsync(room, { _id: uid }))) {
		throw new Error('error-not-allowed');
	}

	return snippet;
}

export async function findSnippetedMessages({
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
	if (!(await getValue('Message_AllowSnippeting'))) {
		throw new Error('error-not-allowed');
	}
	const room = await Rooms.findOneById(roomId);

	if (!room || !(await canAccessRoomAsync(room, { _id: uid }))) {
		throw new Error('error-not-allowed');
	}

	const { cursor, totalCount } = Messages.findSnippetedByRoom(roomId, {
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
