import type { IMessage } from '@rocket.chat/core-typings';
import { Messages, NotificationHistory, Rooms } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

type FindAllActivityHubUserParams = {
	uid: string;
	pagination: {
		offset: number;
		count: number;
		sort?: Record<string, 1 | -1>;
	};
};

export async function findAllStarredMessagesByUser({
	uid,
	pagination: { offset, count, sort },
}: FindAllActivityHubUserParams): Promise<{ messages: IMessage[]; total: number }> {
	const options: FindOptions<IMessage> = {
		sort: sort ?? { ts: -1 },
		skip: offset,
		limit: count,
	};

	const { cursor, totalCount } = Messages.findPaginatedStarredByUserId(uid, options);

	const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

	return { messages, total };
}

export async function findAllMentionsByUser({
	uid,
	pagination: { offset, count },
}: FindAllActivityHubUserParams): Promise<{ messages: IMessage[]; total: number }> {
	const { cursor, totalCount } = NotificationHistory.findPaginatedByUserId(uid, {
		limit: count,
		skip: offset,
		type: 'mention',
	});

	const [notifications, total] = await Promise.all([cursor.toArray(), totalCount]);
	const msgIds = notifications.map((n) => n.msgId);

	if (msgIds.length === 0) {
		return { messages: [], total };
	}

	const messages = await Messages.findVisibleByIds(msgIds).toArray();

	return { messages, total };
}

export async function findAllReactionsForUser({
	uid,
	pagination: { offset, count },
}: FindAllActivityHubUserParams): Promise<{ messages: IMessage[]; total: number }> {
	const { cursor, totalCount } = NotificationHistory.findPaginatedByUserId(uid, {
		limit: count,
		skip: offset,
		type: 'reaction',
	});

	const [notifications, total] = await Promise.all([cursor.toArray(), totalCount]);
	const msgIds = notifications.map((n) => n.msgId);

	if (msgIds.length === 0) {
		return { messages: [], total };
	}

	const messages = await Messages.findVisibleByIds(msgIds).toArray();

	return { messages, total };
}

export async function findAllActivitiesByUser({
	uid,
	pagination: { offset, count },
}: FindAllActivityHubUserParams): Promise<{ messages: IMessage[]; total: number }> {
	const { cursor, totalCount } = NotificationHistory.findPaginatedByUserId(uid, {
		limit: count,
		skip: offset,
	});

	const [notifications, total] = await Promise.all([cursor.toArray(), totalCount]);
	const msgIds = notifications.map((n) => n.msgId);

	if (msgIds.length === 0) {
		return { messages: [], total };
	}

	// Remove duplicates (same message might have multiple activity types, e.g. mentioned and starred)
	const uniqueMsgIds = [...new Set(msgIds)];
	const messages = await Messages.findVisibleByIds(uniqueMsgIds).toArray();

	return { messages, total };
}

export async function createReactionNotification(userId: string, message: IMessage, reaction: string, shouldReact: boolean): Promise<void> {
	if (!shouldReact || message.u._id === userId) {
		return;
	}

	const room = await Rooms.findOneById(message.rid);
	if (!room) {
		return;
	}

	await NotificationHistory.insertOne({
		userId: message.u._id,
		roomId: message.rid,
		msgId: message._id,
		roomName: room.name || room.fname,
		message: `${reaction}`, // Store the reaction as the message or separate field? For now, follow the pattern.
		type: 'reaction',
		ts: new Date(),
		_updatedAt: new Date(),
	} as any);
}

export async function createMentionNotifications(message: IMessage, mentionIds: string[]): Promise<void> {
	if (!mentionIds.length) {
		return;
	}

	const room = await Rooms.findOneById(message.rid);
	if (!room) {
		return;
	}

	const notifications = mentionIds.map((userId) => ({
		userId,
		roomId: message.rid,
		msgId: message._id,
		roomName: room.name || room.fname,
		message: message.msg,
		type: 'mention',
		ts: new Date(),
		_updatedAt: new Date(),
	}));

	await NotificationHistory.insertMany(notifications as any);
}