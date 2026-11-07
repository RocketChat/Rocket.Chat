import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import type { Filter, FindOptions } from 'mongodb';

import { canAccessRoomIdAsync } from '../lib/authorization/canAccessRoom';
import { getChannelHistory } from '../meteor-methods/messages/getChannelHistory';

type CursorPaginationType = 'UPDATED' | 'DELETED';

/** Parse the timestamp prefix of a numeric or timestamp/ID continuation cursor. */
export function extractTimestampFromCursor(cursor: string): Date {
	const prefix = cursor.split('_', 1)[0];
	const timestamp = Number(prefix);
	if (!/^-?\d+$/.test(prefix) || !Number.isSafeInteger(timestamp) || Number.isNaN(new Date(timestamp).getTime())) {
		throw new Error('Invalid Date');
	}
	return new Date(timestamp);
}

/** Build a timestamp boundary and bounded, deterministic database read options. */
export function mountCursorQuery({ next, previous, count }: { next?: string; previous?: string; count: number }): {
	query: { $gt: Date } | { $lt: Date };
	options: FindOptions<IMessage>;
} {
	const order = previous ? -1 : 1;
	const options: FindOptions<IMessage> = { sort: { _updatedAt: order, _id: order }, limit: count + 1 };
	return {
		query: previous ? { $lt: extractTimestampFromCursor(previous) } : { $gt: next ? extractTimestampFromCursor(next) : new Date(0) },
		options,
	};
}

/** Construct a lexicographic boundary, including an empty-ID starting millisecond in either direction. */
export function mountSyncFilter(field: '_updatedAt' | '_deletedAt', cursor: string | undefined, previous: boolean): Filter<IMessage> {
	const timestamp = cursor ? extractTimestampFromCursor(cursor) : new Date(0);
	const operator = previous ? '$lt' : '$gt';
	const separator = cursor?.indexOf('_') ?? -1;
	if (!cursor || separator === -1) return { [field]: { [operator]: timestamp } };
	const id = cursor.slice(separator + 1);
	if (id === '') return { [field]: { [previous ? '$lte' : '$gte']: timestamp } };
	return { $or: [{ [field]: { [operator]: timestamp } }, { [field]: timestamp, _id: { [operator]: id } }] };
}

export function mountCursorFromMessage(message: IMessage & { _deletedAt?: Date }, type: 'UPDATED' | 'DELETED', compound = false): string {
	if (type === 'UPDATED' && message._updatedAt) {
		return `${message._updatedAt.getTime()}${compound ? `_${message._id}` : ''}`;
	}

	if (type === 'DELETED' && message._deletedAt) {
		return `${message._deletedAt.getTime()}${compound ? `_${message._id}` : ''}`;
	}

	throw new ClientSafeError('error-cursor-not-found', 'Cursor not found', { method: 'messages/get' });
}

export function mountNextCursor(
	messages: IMessage[],
	count: number,
	type: CursorPaginationType,
	next?: string,
	previous?: string,
	compound = false,
): string | null {
	if (messages.length === 0) {
		return null;
	}

	if (previous) {
		return mountCursorFromMessage(messages[0], type, compound);
	}

	if (messages.length <= count && next) {
		return null;
	}

	if (messages.length > count && next) {
		return mountCursorFromMessage(messages[messages.length - 2], type, compound);
	}

	return mountCursorFromMessage(messages[messages.length - 1], type, compound);
}

export function mountPreviousCursor(
	messages: IMessage[],
	count: number,
	type: CursorPaginationType,
	next?: string,
	previous?: string,
	compound = false,
): string | null {
	if (messages.length === 0) {
		return null;
	}

	if (messages.length <= count && next) {
		return mountCursorFromMessage(messages[0], type, compound);
	}

	if (messages.length > count && next) {
		return mountCursorFromMessage(messages[0], type, compound);
	}

	if (messages.length <= count && previous) {
		return null;
	}

	if (messages.length > count && previous) {
		return mountCursorFromMessage(messages[messages.length - 2], type, compound);
	}

	return mountCursorFromMessage(messages[0], type, compound);
}

export async function handleWithoutPagination(rid: IRoom['_id'], lastUpdate: Date, fromTs?: Date) {
	const options: FindOptions<IMessage> = { sort: { ts: -1 } };

	const [updatedMessages, deletedMessages] = await Promise.all([
		Messages.findForUpdates(rid, { updatedAt: { $gt: lastUpdate }, minTs: fromTs }, options).toArray(),
		Messages.trashFindDeletedAfter(
			lastUpdate,
			{ rid, ...(fromTs && { ts: { $gte: fromTs } }) },
			{ projection: { _id: 1, _deletedAt: 1 }, ...options },
		).toArray(),
	]);

	return {
		updated: updatedMessages,
		deleted: deletedMessages,
	};
}

/**
 * Read at most count sync records, with one lookahead record to detect continuation.
 * Numeric starting cursors are accepted; returned cursors are opaque timestamp/ID
 * strings that clients must pass back unchanged. The ID resumes within timestamp
 * groups without materializing them, including in the reverse direction.
 */
export async function handleCursorPagination(
	type: CursorPaginationType,
	rid: IRoom['_id'],
	count: number,
	next?: string,
	previous?: string,
): Promise<{
	updated: IMessage[];
	deleted: IMessage[];
	cursor: { next: string | null; previous: string | null };
}> {
	if (!Number.isSafeInteger(count) || count < 1) throw new ClientSafeError('error-invalid-count', 'count must be a positive integer');
	const field = type === 'UPDATED' ? '_updatedAt' : '_deletedAt';
	const { options } = mountCursorQuery({ next, previous, count });
	const order = previous ? -1 : 1;
	options.sort = { [field]: order, _id: order };
	const boundary = next || previous;
	const filter = mountSyncFilter(field, boundary, !!previous);
	const response =
		type === 'UPDATED'
			? await Messages.findForSync(rid, filter, options).toArray()
			: ((await Messages.trashFind({ rid, ...filter }, { projection: { _id: 1, _deletedAt: 1 }, ...options })!.toArray()) as IMessage[]);
	const cursor = {
		next: mountNextCursor(response, count, type, next, previous, true),
		previous: mountPreviousCursor(response, count, type, next, previous, true),
	};
	if (response.length > count) response.pop();
	return { updated: type === 'UPDATED' ? response : [], deleted: type === 'DELETED' ? response : [], cursor };
}

export const getMessageHistory = async (
	rid: IRoom['_id'],
	fromId: string,
	{
		lastUpdate,
		fromTs,
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
		fromTs?: Date;
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
		throw new ClientSafeError('error-not-allowed', 'Not allowed', { method: 'messages/get' });
	}

	if (type && !['UPDATED', 'DELETED'].includes(type)) {
		throw new ClientSafeError('error-type-param-not-supported', 'The "type" parameter must be either "UPDATED" or "DELETED"');
	}

	if ((next || previous) && !type) {
		throw new ClientSafeError(
			'error-type-param-required',
			'The "type" parameter is required when using the "next" or "previous" parameters',
		);
	}

	if (next && previous) {
		throw new ClientSafeError('error-cursor-conflict', 'You cannot provide both "next" and "previous" parameters');
	}

	if ((next || previous) && lastUpdate) {
		throw new ClientSafeError(
			'error-cursor-and-lastUpdate-conflict',
			'The attributes "next", "previous" and "lastUpdate" cannot be used together',
		);
	}

	// `fromTs` only bounds the query on the `lastUpdate` path; neither cursor pagination nor the channel
	// history fallback honors it, so accepting it there would silently widen the result set.
	if (fromTs && !lastUpdate) {
		throw new ClientSafeError('error-fromTs-requires-lastUpdate', 'The "fromTs" parameter can only be used together with "lastUpdate"');
	}

	const hasCursorPagination = !!((next || previous) && count !== null && type);

	if (!hasCursorPagination && !lastUpdate) {
		return getChannelHistory({ rid, fromUserId: fromId, latest: latestDate, oldest: oldestDate, inclusive, count, unreads });
	}

	if (lastUpdate) {
		return handleWithoutPagination(rid, lastUpdate, fromTs);
	}

	if (!type) {
		throw new ClientSafeError('error-param-required', 'The "type" or "lastUpdate" parameters must be provided');
	}

	return handleCursorPagination(type, rid, count, next, previous);
};
