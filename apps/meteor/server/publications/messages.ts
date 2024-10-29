import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';

import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';

type CursorPaginationType = 'UPDATED' | 'DELETED';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'messages/get': (
			rid: IRoom['_id'],
			options: {
				lastUpdate?: Date;
				latestDate?: Date;
				oldestDate?: Date;
				inclusive?: boolean;
				count?: number;
				unreads?: boolean;
				next?: string;
				previous?: string;
				type?: CursorPaginationType;
			},
		) => Promise<{
			updated: IMessage[];
			deleted: IMessage[];
			cursor: {
				next: string | null;
				previous: string | null;
			};
		}>;
	}
}

export function extractTimestampFromCursor(cursor: string): Date {
	return new Date(parseInt(cursor, 10));
}

export function mountCursorQuery({ next, previous, count }: { next?: string; previous?: string; count: number }): {
	query: { $gt: Date } | { $lt: Date };
	options: FindOptions<IMessage>;
} {
	const options: FindOptions<IMessage> = {
		sort: { ts: -1 },
		...(next || previous ? { limit: count + 1 } : {}),
	};

	if (next) {
		return { query: { $gt: extractTimestampFromCursor(next) }, options };
	}

	if (previous) {
		return { query: { $lt: extractTimestampFromCursor(previous) }, options };
	}

	return { query: { $gt: new Date(0) }, options };
}

export function mountCursorFromMessage(message: IMessage & { _deletedAt?: Date }, type: 'UPDATED' | 'DELETED'): string {
	if (type === 'UPDATED') {
		return `${message._updatedAt.getTime()}`;
	}

	if (type === 'DELETED' && message._deletedAt) {
		return `${message._deletedAt.getTime()}`;
	}

	throw new Meteor.Error('error-cursor-not-found', 'Cursor not found', { method: 'messages/get' });
}

export function mountNextCursor(messages: IMessage[], type: CursorPaginationType, _next?: string, previous?: string): string | null {
	// if messages length is greater than 0, it means that we might have more messages
	// and we shall return a cursor pointing to the most recent message from the current batch

	// since we are already sorted by descending order on database query
	// it's not performant to enumerate the existence of a next cursor
	// so we can just return the timestamp from the most recent message
	// and the client will move forward in the messages
	if (messages.length > 0) {
		return mountCursorFromMessage(messages[0], type);
	}

	if (messages.length === 0 && previous) {
		return `${parseInt(previous, 10) - 1}`;
	}

	return null;
}

export function mountPreviousCursor(messages: IMessage[], type: CursorPaginationType, count?: number, next?: string): string | null {
	// if count is null, we don't have to return a cursor
	// because we are going to return all the messages
	if (count === null) {
		return null;
	}

	// if messages length is 0 and next is provided, it means we reached the end of the messages
	// and we shall return a cursor that inverts the current query
	if (messages.length === 0 && next) {
		return `${parseInt(next, 10) + 1}`;
	}

	// if messages length is equal to count and next is provided, it means we reached the end of the messages
	// and we shall return a cursor that inverts the current query
	if (messages.length === count && next) {
		return `${parseInt(next, 10) - 1}`;
	}

	// if messages length is less or equal to count, it means we are at the end of the messages
	// and we shall not return a cursor
	if (count && messages.length <= count) {
		return null;
	}

	// if messages length is greater than count, it means we are not at the end of the messages
	// and we shall return a cursor
	if (count && messages.length > count) {
		return mountCursorFromMessage(messages[messages.length - 2], type);
	}

	return null;
}

export async function handleWithoutPagination(rid: IRoom['_id'], lastUpdate: Date) {
	const query = { $gt: lastUpdate };
	const options: FindOptions<IMessage> = { sort: { ts: -1 } };

	const [updatedMessages, deletedMessages] = await Promise.all([
		Messages.findForUpdates(rid, query, options).toArray(),
		Messages.trashFindDeletedAfter(lastUpdate, { rid }, { projection: { _id: 1, _deletedAt: 1 }, ...options }).toArray(),
	]);

	return {
		updated: updatedMessages,
		deleted: deletedMessages,
	};
}

export async function handleCursorPagination(
	type: CursorPaginationType,
	rid: IRoom['_id'],
	count: number,
	next?: string,
	previous?: string,
) {
	const { query, options } = mountCursorQuery({ next, previous, count });

	const response =
		type === 'UPDATED'
			? await Messages.findForUpdates(rid, query, options).toArray()
			: (await Messages.trashFind({ rid, _deletedAt: query }, { projection: { _id: 1, _deletedAt: 1 }, ...options })!.toArray()) ?? [];

	const cursor = {
		next: mountNextCursor(response, type, next, previous),
		previous: mountPreviousCursor(response, type, count, next),
	};

	if (count && count !== null && response.length > count) {
		response.pop();
	}

	return {
		[type.toLowerCase()]: response,
		cursor,
	};
}

Meteor.methods<ServerMethods>({
	async 'messages/get'(
		rid,
		{ lastUpdate, latestDate = new Date(), oldestDate, inclusive = false, count = 20, unreads = false, next, previous, type },
	) {
		check(rid, String);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'messages/get' });
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'messages/get' });
		}

		if (!(await canAccessRoomIdAsync(rid, fromId))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'messages/get' });
		}

		if (type && !['UPDATED', 'DELETED'].includes(type)) {
			throw new Meteor.Error('error-type-param-not-supported', 'The "type" parameter must be either "UPDATED" or "DELETED"');
		}

		if ((next || previous) && !type) {
			throw new Meteor.Error(
				'error-type-param-required',
				'The "type" parameter is required when using the "next" or "previous" parameters',
			);
		}

		if (next && previous) {
			throw new Meteor.Error('error-cursor-conflict', 'You cannot have both "next" and "previous" parameters');
		}

		if ((next || previous) && lastUpdate) {
			throw new Meteor.Error(
				'error-cursor-and-lastUpdate-conflict',
				'The attributes "next", "previous" and "lastUpdate" cannot be used together',
			);
		}

		const hasCursorPagination = !!((next || previous) && count !== null && type);

		if (!hasCursorPagination && !lastUpdate) {
			return Meteor.callAsync('getChannelHistory', {
				rid,
				latest: latestDate,
				oldest: oldestDate,
				inclusive,
				count,
				unreads,
			});
		}

		const response = lastUpdate
			? await handleWithoutPagination(rid, lastUpdate)
			: await handleCursorPagination(type ?? 'UPDATED', rid, count, next, previous);

		return response;
	},
});
