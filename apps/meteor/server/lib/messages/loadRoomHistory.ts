import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { settings } from '../../settings/cached';
import { getHiddenSystemMessages } from '../messaging/getHiddenSystemMessages';
import { normalizeMessagesForUser } from '../utils/lib/normalizeMessagesForUser';

// Upper bound for forward paging. `findVisibleByRoomIdBetweenTimestampsNotContainingTypes` needs a
// closed range, and messages can carry a `ts` slightly ahead of the server clock (client-supplied
// timestamps, federation), so `new Date()` would silently drop them.
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
	const timestamp = parseInt(cursor, 10);
	const date = new Date(timestamp);

	if (Number.isNaN(timestamp) || date.toString() === 'Invalid Date') {
		throw new Error('error-invalid-cursor');
	}

	return date;
}

/**
 * Cursor-paginated room history, ordered newest-first regardless of paging direction.
 *
 * Cursors encode a message `ts`, mirroring the `next`/`previous` contract of `chat.syncMessages`
 * (which encodes `_updatedAt` instead). `previous` walks backwards into older messages, `next`
 * walks forwards into newer ones; passing neither returns the newest page.
 *
 * `lastSeen` is the client's subscription marker and is used *only* to position the unread divider.
 * It is deliberately not a pagination bound — conflating the two silently truncates the page at the
 * last-seen marker, which is the bug that makes the per-type `*.history` endpoints unusable here.
 *
 * @param userId - undefined when the caller is reading anonymously
 */
export async function loadRoomHistory({
	userId,
	rid,
	next,
	previous,
	lastSeen,
	count = 20,
	showThreadMessages = true,
	room: providedRoom,
}: {
	userId?: string;
	rid: IRoom['_id'];
	next?: string;
	previous?: string;
	lastSeen?: Date;
	count?: number;
	showThreadMessages?: boolean;
	room?: IRoom;
}): Promise<RoomHistoryResult> {
	if (next && previous) {
		throw new Error('error-cursor-conflict');
	}

	const room = providedRoom ?? (await Rooms.findOneById(rid, { projection: { sysMes: 1, t: 1 } }));

	if (!room) {
		throw new Error('error-invalid-room');
	}

	const hiddenMessageTypes = getHiddenSystemMessages(room, settings.get<MessageTypesValues[]>('Hide_System_Messages'));

	// One extra document tells us whether a further page exists without a second round trip.
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

	const hasMoreInPagingDirection = records.length > count;

	if (hasMoreInPagingDirection) {
		records.pop();
	}

	// Normalize to newest-first so callers get one ordering contract in both directions.
	if (next) {
		records.reverse();
	}

	const newest = records[0];
	const oldest = records[records.length - 1];

	// A null cursor means "no more in that direction", matching `chat.syncMessages`. In the direction
	// we travelled the extra document answers it; in the direction we came from more messages exist by
	// definition — except on the first page, which starts at the newest end and so has nothing newer.
	const hasNewer = next ? hasMoreInPagingDirection : Boolean(previous);
	const hasOlder = next ? true : hasMoreInPagingDirection;

	const cursor: RoomHistoryCursor = {
		next: newest && hasNewer ? encodeHistoryCursor(newest.ts) : null,
		previous: oldest && hasOlder ? encodeHistoryCursor(oldest.ts) : null,
	};

	const [messages, unread] = await Promise.all([
		normalizeMessagesForUser(records, userId),
		computeUnread({ rid, lastSeen, oldest, hiddenMessageTypes, showThreadMessages }),
	]);

	return { messages, cursor, ...unread };
}

async function computeUnread({
	rid,
	lastSeen,
	oldest,
	hiddenMessageTypes,
	showThreadMessages,
}: {
	rid: IRoom['_id'];
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

	return { firstUnread: firstUnreadRecords[0], unreadNotLoaded };
}
