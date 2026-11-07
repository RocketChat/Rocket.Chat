import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { canAccessRoomIdAsync } from '../lib/authorization/canAccessRoom';
import { getChannelHistory } from '../meteor-methods/messages/getChannelHistory';

type CursorPaginationType = 'UPDATED' | 'DELETED';

export function extractTimestampFromCursor(cursor: string): Date {
	const timestamp = parseInt(cursor, 10);

	if (isNaN(timestamp) || new Date(timestamp).toString() === 'Invalid Date') {
		throw new Error('Invalid Date');
	}

	return new Date(timestamp);
}

/**
 * Build an exclusive timestamp boundary and database batch options for sync pagination.
 *
 * `next` traverses newer timestamps; `previous` traverses older timestamps. Cursors
 * are timestamp-only: compound timestamp/ID cursors are not part of this contract.
 * Use a batch size rather than a result limit so the caller can finish a group of
 * messages sharing the boundary timestamp before returning a continuation cursor.
 *
 * @param params - Pagination direction, timestamp cursor, and target page size.
 * @returns The timestamp filter and database read options.
 */
export function mountCursorQuery({ next, previous, count }: { next?: string; previous?: string; count: number }): {
	query: { $gt: Date } | { $lt: Date };
	options: FindOptions<IMessage>;
} {
	const options: FindOptions<IMessage> = {
		sort: { _updatedAt: 1 },
		...(next || previous ? { batchSize: count + 1 } : {}),
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

	throw new ClientSafeError('error-cursor-not-found', 'Cursor not found', { method: 'messages/get' });
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
 * Read a sync page without splitting messages that share an update or deletion timestamp.
 *
 * The page contains at least `count` messages when available, plus the rest of its
 * final timestamp group. One additional message determines whether another page
 * exists. Iteration stops there and closes the database cursor. A timestamp group
 * has no fixed size, so `count` and the database batch size are not response-size
 * or memory limits. Returned cursors remain compatible with timestamp-only clients.
 *
 * @param type - Select updated messages or deleted-message tombstones.
 * @param rid - Room whose messages are being synchronized.
 * @param count - Target page size; tied timestamps can make the page larger.
 * @param next - Exclusive timestamp boundary for forward traversal.
 * @param previous - Exclusive timestamp boundary for backward traversal.
 * @returns Messages and continuation cursors; the traversal cursor is null at exhaustion.
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
	cursor?: {
		next: string | null;
		previous: string | null;
	};
}> {
	const { query, options } = mountCursorQuery({ next, previous, count });

	// Deleted-message cursors must use the same field for ordering and filtering.
	options.sort = { [type === 'UPDATED' ? '_updatedAt' : '_deletedAt']: previous ? -1 : 1 };
	const messages =
		type === 'UPDATED'
			? Messages.findForUpdates(rid, { updatedAt: query }, options)
			: Messages.trashFind({ rid, _deletedAt: query }, { projection: { _id: 1, _deletedAt: 1 }, ...options })!;

	const response: IMessage[] = [];
	let hasMore = false;
	for await (const message of messages) {
		// A timestamp-only cursor cannot resume within a group of equal timestamps.
		// Treat count as a target and finish the boundary group before advancing it.
		// batchSize bounds database batches without truncating that group with limit.
		if (
			response.length >= count &&
			response.length > 0 &&
			mountCursorFromMessage(message as IMessage, type) !== mountCursorFromMessage(response[response.length - 1], type)
		) {
			response.push(message as IMessage);
			hasMore = true;
			break;
		}
		response.push(message as IMessage);
	}

	// Cursor helpers expect one lookahead entry, even when a page exceeds count.
	const pageSize = response.length - (hasMore ? 1 : 0);
	const cursor = {
		next: mountNextCursor(response, pageSize, type, next, previous),
		previous: mountPreviousCursor(response, pageSize, type, next, previous),
	};

	if (hasMore) {
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
