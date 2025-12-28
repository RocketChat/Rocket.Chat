import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';

import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';
import { getChannelHistory } from '../../app/lib/server/methods/getChannelHistory';

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
		) => Promise<
			| {
					updated: IMessage[];
					deleted: IMessage[];
					cursor?: {
						next: string | null;
						previous: string | null;
					};
			  }
			| boolean
			| IMessage[]
			| { messages: IMessage[]; firstUnread?: any; unreadNotLoaded?: number }
		>;
	}
}

export function extractTimestampFromCursor(cursor: string): Date {
	const timestamp = parseInt(cursor, 10);

	if (isNaN(timestamp) || new Date(timestamp).toString() === 'Invalid Date') {
		throw new Error('Invalid Date');
	}

	return new Date(timestamp);
}

export function mountCursorQuery({ next, previous, count }: { next?: string; previous?: string; count: number }): {
	query: { $gt: Date } | { $lt: Date };
	options: FindOptions<IMessage>;
} {
	const options: FindOptions<IMessage> = {
		sort: { _updatedAt: 1 },
		...(next || previous ? { limit: count + 1 } : {}),
	};

	if (next) {
		return { query: { $gt: extractTimestampFromCursor(next) }, options };
	}

	if (previous) {
		return { query: { $lt: extractTimestampFromCursor(previous) }, options: { ...options, sort: { _updatedAt: -1 } } };
	}

	return { query: { $gt: new Date(0) }, options };
}

export function mountCursorFromMessage(message: IMessage & { _deletedAt?: Date }, type: 'UPDATED' | 'DELETED'): string {
	if (type === 'UPDATED' && message._updatedAt) {
		return `${message._updatedAt.getTime()}`;
	}

	if (type === 'DELETED' && message._deletedAt) {
		return `${message._deletedAt.getTime()}`;
	}

	throw new Meteor.Error('error-cursor-not-found', 'Cursor not found', { method: 'messages/get' });
}

export function mountNextCursor(
	messages: IMessage[],
	count: number,
	type: CursorPaginationType,
	next?: string,
	previous?: string,
): string | null {
	if (messages.length === 0) {
		return null;
	}

	if (previous) {
		return mountCursorFromMessage(messages[0], type);
	}

	if (messages.length <= count && next) {
		return null;
	}

	if (messages.length > count && next) {
		return mountCursorFromMessage(messages[messages.length - 2], type);
	}

	return mountCursorFromMessage(messages[messages.length - 1], type);
}

export function mountPreviousCursor(
	messages: IMessage[],
	count: number,
	type: CursorPaginationType,
	next?: string,
	previous?: string,
): string | null {
	if (messages.length === 0) {
		return null;
	}

	if (messages.length <= count && next) {
		return mountCursorFromMessage(messages[0], type);
	}

	if (messages.length > count && next) {
		return mountCursorFromMessage(messages[0], type);
	}

	if (messages.length <= count && previous) {
		return null;
	}

	if (messages.length > count && previous) {
		return mountCursorFromMessage(messages[messages.length - 2], type);
	}

	return mountCursorFromMessage(messages[0], type);
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
): Promise<{
	updated: IMessage[];
	deleted: IMessage[];
	cursor?: {
		next: string | null;
		previous: string | null;
	};
}> {
	const { query, options } = mountCursorQuery({ next, previous, count });

	const response =
		type === 'UPDATED'
			? await Messages.findForUpdates(rid, query, options).toArray()
			: ((await Messages.trashFind(
					{ rid, _deletedAt: query },
					{ projection: { _id: 1, _deletedAt: 1 }, ...options },
				)!.toArray()) as IMessage[]);

	const cursor = {
		next: mountNextCursor(response, count, type, next, previous),
		previous: mountPreviousCursor(response, count, type, next, previous),
	};

	if (response.length > count) {
		response.pop();
	}

	return {
		updated: type === 'UPDATED' ? response : [],
		deleted: type === 'DELETED' ? response : [],
		cursor,
	};
}

export const getMessageHistory = async (
	rid: IRoom['_id'],
	fromId: string,
	{
		lastUpdate,
		latestDate = new Date(),
		oldestDate,
		inclusive = false,
		count = 20,
		unreads = false,
		next,
		previous,
		type,
	}: {
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
): Promise<
	| {
			updated: IMessage[];
			deleted: IMessage[];
			cursor?: {
				next: string | null;
				previous: string | null;
			};
	  }
	| false
	| IMessage[]
	| { messages: IMessage[]; firstUnread?: any; unreadNotLoaded?: number }
> => {
	if (!(await canAccessRoomIdAsync(rid, fromId))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'messages/get' });
	}

	if (type && !['UPDATED', 'DELETED'].includes(type)) {
		throw new Meteor.Error('error-type-param-not-supported', 'The "type" parameter must be either "UPDATED" or "DELETED"');
	}

	if ((next || previous) && !type) {
		throw new Meteor.Error('error-type-param-required', 'The "type" parameter is required when using the "next" or "previous" parameters');
	}

	if (next && previous) {
		throw new Meteor.Error('error-cursor-conflict', 'You cannot provide both "next" and "previous" parameters');
	}

	if ((next || previous) && lastUpdate) {
		throw new Meteor.Error(
			'error-cursor-and-lastUpdate-conflict',
			'The attributes "next", "previous" and "lastUpdate" cannot be used together',
		);
	}

	const hasCursorPagination = !!((next || previous) && count !== null && type);

	if (!hasCursorPagination && !lastUpdate) {
		return getChannelHistory({ rid, fromUserId: fromId, latest: latestDate, oldest: oldestDate, inclusive, count, unreads });
	}

	if (lastUpdate) {
		return handleWithoutPagination(rid, lastUpdate);
	}

	if (!type) {
		throw new Meteor.Error('error-param-required', 'The "type" or "lastUpdate" parameters must be provided');
	}

	return handleCursorPagination(type, rid, count, next, previous);
};

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

		return getMessageHistory(rid, fromId, { lastUpdate, latestDate, oldestDate, inclusive, count, unreads, next, previous, type });
	},
});
