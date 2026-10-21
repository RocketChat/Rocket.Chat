import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { prepareMessagesForReader } from './securityLabels';
import { settings } from '../../settings/cached';
import { getHiddenSystemMessages } from '../messaging/getHiddenSystemMessages';
import { normalizeMessagesForUser } from '../utils/lib/normalizeMessagesForUser';

// The range query needs a closed upper bound; `new Date()` would drop client-stamped future `ts`.
const FAR_FUTURE = new Date(8640000000000000);

// Bounds how far a page looks past messages the reader may not read before giving up on filling it.
const MAX_SCANNED_PAGES = 20;

type Readable = (records: IMessage[]) => Promise<IMessage[]>;

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
		throw new ClientSafeError('error-invalid-cursor', 'Invalid pagination cursor');
	}

	const date = new Date(parseInt(cursor, 10));

	if (date.toString() === 'Invalid Date') {
		throw new ClientSafeError('error-invalid-cursor', 'Invalid pagination cursor');
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
	around,
	lastSeen,
	count = 20,
	showThreadMessages = true,
	room,
}: {
	userId?: string;
	next?: string;
	previous?: string;
	around?: IMessage;
	lastSeen?: Date;
	count?: number;
	showThreadMessages?: boolean;
	room: IRoom;
}): Promise<RoomHistoryResult> {
	if ([next, previous, around].filter(Boolean).length > 1) {
		throw new ClientSafeError('error-cursor-conflict', 'Only one of "next", "previous" and "aroundId" can be provided');
	}

	const rid = room._id;
	const readable: Readable = (records) => prepareMessagesForReader(records, userId);

	const hiddenMessageTypes = getHiddenSystemMessages(room, settings.get<MessageTypesValues[]>('Hide_System_Messages'));

	const { records, hasNewer, hasOlder } = around
		? await loadAround({ rid, around, count, hiddenMessageTypes, showThreadMessages, readable })
		: await loadPage({ rid, next, previous, count, hiddenMessageTypes, showThreadMessages, readable });

	const newest = records[0];
	const oldest = records[records.length - 1];

	const cursor: RoomHistoryCursor = {
		next: newest && hasNewer ? encodeHistoryCursor(newest.ts.getTime() < 0 ? new Date(0) : newest.ts) : null,
		previous: oldest && hasOlder && oldest.ts.getTime() >= 0 ? encodeHistoryCursor(oldest.ts) : null,
	};

	const [messages, unread] = await Promise.all([
		normalizeMessagesForUser(records, userId),
		computeUnread({
			rid,
			userId,
			lastSeen,
			oldest,
			hiddenMessageTypes,
			showThreadMessages,
			readable: room.securityClearance ? readable : undefined,
		}),
	]);

	return { messages, cursor, ...unread };
}

// In-memory `_id` tie-break for equal `ts`: the `{ rid, ts, _updatedAt }` index cannot back a
// `{ ts, _id }` sort, and without it MongoDB's order among equal timestamps is unspecified.
function sortByTs(records: IMessage[], direction: 1 | -1): IMessage[] {
	return records.sort((a, b) => (a.ts.getTime() - b.ts.getTime() || (a._id < b._id ? -1 : 1)) * direction);
}

type Window = { records: IMessage[]; hasNewer: boolean; hasOlder: boolean };

async function loadPage({
	rid,
	next,
	previous,
	count,
	hiddenMessageTypes,
	showThreadMessages,
	readable,
}: {
	rid: IRoom['_id'];
	next?: string;
	previous?: string;
	count: number;
	hiddenMessageTypes: MessageTypesValues[];
	showThreadMessages: boolean;
	readable: Readable;
}): Promise<Window> {
	const fetchFrom = (boundary: Date, limit: number) => {
		const options: FindOptions<IMessage> = { sort: { ts: next ? 1 : -1 }, limit };
		return next
			? Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
					rid,
					boundary,
					FAR_FUTURE,
					hiddenMessageTypes,
					options,
					showThreadMessages,
				).toArray()
			: Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(
					rid,
					boundary,
					hiddenMessageTypes,
					options,
					showThreadMessages,
				).toArray();
	};

	// One extra document reveals whether a further page exists. Messages the reader may not read are skipped
	// while filling the page, so neither the page nor its cursors betray when they were sent.
	const records: IMessage[] = [];
	const cursor = next ?? previous;
	let boundary = cursor ? decodeHistoryCursor(cursor) : FAR_FUTURE;
	let exhausted = false;
	for (let scanned = 0; scanned < MAX_SCANNED_PAGES && records.length <= count && !exhausted; scanned++) {
		const limit = count + 1 - records.length;
		// eslint-disable-next-line no-await-in-loop
		const page = sortByTs(await fetchFrom(boundary, limit), next ? 1 : -1);
		exhausted = page.length < limit;
		if (page.length) {
			boundary = page[page.length - 1].ts;
		}
		// eslint-disable-next-line no-await-in-loop
		records.push(...(await readable(page)));
	}

	const hasMoreInPagingDirection = records.length > count || !exhausted;

	if (records.length > count) {
		records.length = count;
	}

	if (next) {
		records.reverse();
	}

	// Null means no more in that direction. The side we came from always has more — except the first
	// page, which starts at the newest end.
	return {
		records,
		hasNewer: next ? hasMoreInPagingDirection : Boolean(previous),
		hasOlder: next ? true : hasMoreInPagingDirection,
	};
}

async function loadAround({
	rid,
	around,
	count,
	hiddenMessageTypes,
	showThreadMessages,
	readable,
}: {
	rid: IRoom['_id'];
	around: IMessage;
	count: number;
	hiddenMessageTypes: MessageTypesValues[];
	showThreadMessages: boolean;
	readable: Readable;
}): Promise<Window> {
	// A non-positive count would produce a Mongo `limit: 0`, which means "no limit".
	const remaining = Math.max(count, 1) - 1;
	const olderLimit = Math.ceil(remaining / 2);
	const newerLimit = Math.floor(remaining / 2);

	const [older, newer] = await Promise.all([
		Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(
			rid,
			around.ts,
			hiddenMessageTypes,
			{ sort: { ts: -1 }, limit: olderLimit + 1 },
			showThreadMessages,
		).toArray(),
		Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
			rid,
			around.ts,
			FAR_FUTURE,
			hiddenMessageTypes,
			{ sort: { ts: 1 }, limit: newerLimit + 1 },
			showThreadMessages,
		).toArray(),
	]);

	sortByTs(older, -1);
	sortByTs(newer, 1);

	const hasOlder = older.length > olderLimit;
	const hasNewer = newer.length > newerLimit;

	if (hasOlder) {
		older.pop();
	}

	if (hasNewer) {
		newer.pop();
	}

	// The anchor is included whatever its type, so a jump always lands on its target.
	return { records: [...(await readable(newer.reverse())), around, ...(await readable(older))], hasNewer, hasOlder };
}

async function computeUnread({
	rid,
	userId,
	lastSeen,
	oldest,
	hiddenMessageTypes,
	showThreadMessages,
	readable,
}: {
	rid: IRoom['_id'];
	userId?: string;
	lastSeen?: Date;
	oldest?: IMessage;
	hiddenMessageTypes: MessageTypesValues[];
	showThreadMessages: boolean;
	readable?: Readable;
}): Promise<{ firstUnread?: IMessage; unreadNotLoaded?: number }> {
	if (!lastSeen || Number.isNaN(lastSeen.getTime()) || !oldest || !(new Date(oldest.ts) > lastSeen)) {
		return { firstUnread: undefined, unreadNotLoaded: 0 };
	}

	// In a room that may hold labeled messages, only those the reader may read count as unread
	if (readable) {
		const unread = await readable(
			await Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
				rid,
				lastSeen,
				oldest.ts,
				hiddenMessageTypes,
				{ sort: { ts: 1 } },
				showThreadMessages,
			).toArray(),
		);
		const [firstUnread] = await normalizeMessagesForUser(unread.slice(0, 1), userId);
		return { firstUnread, unreadNotLoaded: unread.length };
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
