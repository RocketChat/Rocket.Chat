import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { canAccessRoomIdAsync } from '../lib/authorization/canAccessRoom';
import { getChannelHistory } from '../meteor-methods/messages/getChannelHistory';

type CursorPaginationType = 'UPDATED' | 'DELETED';

// A cursor is either a bare timestamp (`<ms>`) or a compound `<ms>_<_id>`.
// The compound form orders messages that share one timestamp by `_id`, so a page boundary inside one
// millisecond does not skip messages. A request with a bare timestamp keeps the original behavior and
// gets bare timestamp cursors back, so existing clients see no change.
const COMPOUND_CURSOR_SEPARATOR = '_';

export function extractTimestampFromCursor(cursor: string): Date {
	const timestamp = parseInt(cursor, 10);

	if (isNaN(timestamp) || new Date(timestamp).toString() === 'Invalid Date') {
		throw new Error('Invalid Date');
	}

	return new Date(timestamp);
}

export function parseCursor(cursor: string): { timestamp: Date; id?: string } {
	const separatorIndex = cursor.indexOf(COMPOUND_CURSOR_SEPARATOR);

	if (separatorIndex === -1) {
		return { timestamp: extractTimestampFromCursor(cursor) };
	}

	const timestampPart = cursor.slice(0, separatorIndex);
	if (!/^\d+$/.test(timestampPart)) {
		throw new Error('Invalid Date');
	}

	return { timestamp: extractTimestampFromCursor(timestampPart), id: cursor.slice(separatorIndex + 1) };
}

export function isCompoundCursor(cursor?: string): boolean {
	return !!cursor && cursor.includes(COMPOUND_CURSOR_SEPARATOR);
}

export function mountCursorQuery({
	next,
	previous,
	count,
	type = 'UPDATED',
}: {
	next?: string;
	previous?: string;
	count: number;
	type?: CursorPaginationType;
}): {
	query: { $gt: Date } | { $lt: Date };
	idTieBreaker?: string;
	options: FindOptions<IMessage>;
} {
	const options: FindOptions<IMessage> = {
		sort: { _updatedAt: 1 },
		...(next || previous ? { limit: count + 1 } : {}),
	};
	const cursorField = type === 'DELETED' ? '_deletedAt' : '_updatedAt';

	if (next) {
		const { timestamp, id } = parseCursor(next);
		if (id !== undefined) {
			return { query: { $gt: timestamp }, idTieBreaker: id, options: { ...options, sort: { [cursorField]: 1, _id: 1 } } };
		}
		return { query: { $gt: timestamp }, options };
	}

	if (previous) {
		const { timestamp, id } = parseCursor(previous);
		if (id !== undefined) {
			return { query: { $lt: timestamp }, idTieBreaker: id, options: { ...options, sort: { [cursorField]: -1, _id: -1 } } };
		}
		return { query: { $lt: timestamp }, options: { ...options, sort: { _updatedAt: -1 } } };
	}

	return { query: { $gt: new Date(0) }, options };
}

export function mountCursorFromMessage(message: IMessage & { _deletedAt?: Date }, type: 'UPDATED' | 'DELETED', compound = false): string {
	const date = type === 'UPDATED' ? message._updatedAt : message._deletedAt;

	if (!date) {
		throw new ClientSafeError('error-cursor-not-found', 'Cursor not found', { method: 'messages/get' });
	}

	return compound ? `${date.getTime()}${COMPOUND_CURSOR_SEPARATOR}${message._id}` : `${date.getTime()}`;
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

const toSyncMessage = (message: IMessage): IMessage => {
	if (!message._hidden) {
		return message;
	}

	return {
		_id: message._id,
		rid: message.rid,
		ts: message.ts,
		_updatedAt: message._updatedAt,
		_hidden: true,
		u: message.u,
		t: 'rm',
		msg: '',
	};
};

export async function handleWithoutPagination(rid: IRoom['_id'], lastUpdate: Date, fromTs?: Date) {
	const options: FindOptions<IMessage> = { sort: { ts: -1 } };

	const [updatedMessages, deletedMessages] = await Promise.all([
		Messages.findForUpdates(rid, { updatedAt: { $gt: lastUpdate }, minTs: fromTs }, options).toArray(),
		Messages.findDeletedByRoomIdAfter(rid, lastUpdate, fromTs, { projection: { _id: 1, _deletedAt: 1 }, ...options }).toArray(),
	]);

	return {
		updated: updatedMessages.map(toSyncMessage),
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
	const { query, idTieBreaker, options } = mountCursorQuery({ next, previous, count, type });
	const compound = isCompoundCursor(next ?? previous);

	const response =
		type === 'UPDATED'
			? await Messages.findForUpdates(rid, { updatedAt: query, ...(idTieBreaker !== undefined && { idTieBreaker }) }, options).toArray()
			: ((await Messages.findDeletedByRoomIdAndDeletedAt(
					rid,
					query,
					{ projection: { _id: 1, _deletedAt: 1 }, ...options },
					idTieBreaker,
				).toArray()) as IMessage[]);

	const cursor = {
		next: mountNextCursor(response, count, type, next, previous, compound),
		previous: mountPreviousCursor(response, count, type, next, previous, compound),
	};

	if (response.length > count) {
		response.pop();
	}

	return {
		updated: type === 'UPDATED' ? response.map(toSyncMessage) : [],
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
