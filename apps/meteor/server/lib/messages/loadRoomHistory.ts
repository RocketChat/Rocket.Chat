import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { settings } from '../../settings/cached';
import { getHiddenSystemMessages } from '../messaging/getHiddenSystemMessages';
import { normalizeMessagesForUser } from '../utils/lib/normalizeMessagesForUser';

// The range query needs a closed upper bound; `new Date()` would drop client-stamped future `ts`.
const FAR_FUTURE = new Date(8640000000000000);

export type RoomHistoryCursor = {
	next: string | null;
	previous: string | null;
};

export type RoomHistoryResult = {
	messages: IMessage[];
	cursor: RoomHistoryCursor;
	firstUnread?: IMessage;
	unreadNotLoaded?: number;
};

export function encodeHistoryCursor(ts: Date): string {
	return `${ts.getTime()}`;
}

export function decodeHistoryCursor(cursor: string): Date {
	if (!/^\d+$/.test(cursor)) {
		throw new Error('error-invalid-cursor');
	}

	const date = new Date(parseInt(cursor, 10));

	if (date.toString() === 'Invalid Date') {
		throw new Error('error-invalid-cursor');
	}

	return date;
}

/**
 * Cursor-paginated room history, ordered newest-first regardless of paging direction.
 *
 * `lastSeen` positions the unread divider only. Using it as a pagination bound instead would truncate
 * the page at the marker, which is why the per-type `*.history` endpoints cannot serve this.
 */
export async function loadRoomHistory({
	userId,
	next,
	previous,
	lastSeen,
	count = 20,
	showThreadMessages = true,
	room,
}: {
	userId?: string;
	next?: string;
	previous?: string;
	lastSeen?: Date;
	count?: number;
	showThreadMessages?: boolean;
	room: IRoom;
}): Promise<RoomHistoryResult> {
	if (next && previous) {
		throw new Error('error-cursor-conflict');
	}

	const rid = room._id;

	const hiddenMessageTypes = getHiddenSystemMessages(room, settings.get<MessageTypesValues[]>('Hide_System_Messages'));

	// One extra document reveals whether a further page exists.
	const options: FindOptions<IMessage> = { sort: { ts: next ? 1 : -1 }, limit: count + 1 };

	const records = next
		? await Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
				rid,
				decodeHistoryCursor(next),
				FAR_FUTURE,
				hiddenMessageTypes,
				options,
				showThreadMessages,
			).toArray()
		: await Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(
				rid,
				previous ? decodeHistoryCursor(previous) : FAR_FUTURE,
				hiddenMessageTypes,
				options,
				showThreadMessages,
			).toArray();

	// In-memory `_id` tie-break for equal `ts`: the `{ rid, ts, _updatedAt }` index cannot back a
	// `{ ts, _id }` sort, and without it MongoDB's order among equal timestamps is unspecified.
	const direction = next ? 1 : -1;
	records.sort((a, b) => (a.ts.getTime() - b.ts.getTime() || (a._id < b._id ? -1 : 1)) * direction);

	const hasMoreInPagingDirection = records.length > count;

	if (hasMoreInPagingDirection) {
		records.pop();
	}

	if (next) {
		records.reverse();
	}

	const newest = records[0];
	const oldest = records[records.length - 1];

	// Null means no more in that direction. The side we came from always has more — except the first
	// page, which starts at the newest end.
	const hasNewer = next ? hasMoreInPagingDirection : Boolean(previous);
	const hasOlder = next ? true : hasMoreInPagingDirection;

	const cursor: RoomHistoryCursor = {
		next: newest && hasNewer ? encodeHistoryCursor(newest.ts) : null,
		previous: oldest && hasOlder ? encodeHistoryCursor(oldest.ts) : null,
	};

	const [messages, unread] = await Promise.all([
		normalizeMessagesForUser(records, userId),
		computeUnread({ rid, userId, lastSeen, oldest, hiddenMessageTypes, showThreadMessages }),
	]);

	return { messages, cursor, ...unread };
}

async function computeUnread({
	rid,
	userId,
	lastSeen,
	oldest,
	hiddenMessageTypes,
	showThreadMessages,
}: {
	rid: IRoom['_id'];
	userId?: string;
	lastSeen?: Date;
	oldest?: IMessage;
	hiddenMessageTypes: MessageTypesValues[];
	showThreadMessages: boolean;
}): Promise<{ firstUnread?: IMessage; unreadNotLoaded?: number }> {
	if (!lastSeen || Number.isNaN(lastSeen.getTime()) || !oldest || !(new Date(oldest.ts) > lastSeen)) {
		return { firstUnread: undefined, unreadNotLoaded: 0 };
	}

	const [firstUnreadRecords, unreadNotLoaded] = await Promise.all([
		Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
			rid,
			lastSeen,
			oldest.ts,
			hiddenMessageTypes,
			{ limit: 1, sort: { ts: 1 } },
			showThreadMessages,
		).toArray(),
		Messages.countVisibleByRoomIdBetweenTimestampsNotContainingTypes(rid, lastSeen, oldest.ts, hiddenMessageTypes, showThreadMessages),
	]);

	const [firstUnread] = await normalizeMessagesForUser(firstUnreadRecords, userId);

	return { firstUnread, unreadNotLoaded };
}
