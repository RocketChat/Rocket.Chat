import { Settings } from '@rocket.chat/core-services';
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Messages, Subscriptions } from '@rocket.chat/models';

import type { IPublication } from './types';

type StreamedMessage = Pick<IMessage, 'ts' | 'tmid' | 'tshow' | 'replies'>;

type StreamedRoom = Pick<IRoom, '_id' | 'prid'>;

type Cutoff = { date?: Date; governingRid: IRoom['_id'] };

type TrackedStream = {
	room: StreamedRoom;
	uid: IUser['_id'];
	/** Read on the first event that needs it, then kept current by subscription changes. */
	cutoff?: Promise<Cutoff>;
	/** The cutoff once read, so a subscription change can tell whether it applies. */
	known?: Cutoff;
};

type TrackedRoomList = { publication: IPublication; uid: IUser['_id']; loaded?: Promise<void> };

const streamsByMember = new Map<string, Set<TrackedStream>>();
const trackedByPublication = new WeakMap<IPublication, Map<IRoom['_id'], TrackedStream>>();
const roomListsByUser = new Map<IUser['_id'], Set<TrackedRoomList>>();
const roomListByPublication = new WeakMap<IPublication, TrackedRoomList>();
const enabledByEvent = new WeakMap<object, Promise<boolean>>();

const memberKey = (rid: IRoom['_id'], uid: IUser['_id']) => `${rid}:${uid}`;

const toCutoff = (historyVisibleFrom: ISubscription['historyVisibleFrom']) =>
	historyVisibleFrom ? new Date(historyVisibleFrom) : undefined;

/** Whether the feature is on, read once per event however many subscribers it reaches. */
const isEnabledFor = (event: object): Promise<boolean> => {
	const cached = enabledByEvent.get(event);
	if (cached) {
		return cached;
	}

	const enabled = Settings.get<boolean>('Restricted_Message_History_Enabled').then(Boolean);
	enabledByEvent.set(event, enabled);
	return enabled;
};

const findSubscriptionCutoff = (rid: IRoom['_id'], uid: IUser['_id']) =>
	Subscriptions.findOneByRoomIdAndUserId<Pick<ISubscription, 'historyVisibleFrom'>>(rid, uid, {
		projection: { historyVisibleFrom: 1 },
	});

/** The cutoff that applies: the member's own, or their parent room's for a discussion they read through it. */
async function findCutoff(room: StreamedRoom, uid: IUser['_id']): Promise<Cutoff> {
	const subscription = await findSubscriptionCutoff(room._id, uid);
	if (subscription || !room.prid) {
		return { date: toCutoff(subscription?.historyVisibleFrom), governingRid: room._id };
	}

	const parentSubscription = await findSubscriptionCutoff(room.prid, uid);
	return { date: toCutoff(parentSubscription?.historyVisibleFrom), governingRid: room.prid };
}

function setCutoff(tracked: TrackedStream, cutoff: Cutoff | undefined): void {
	tracked.known = cutoff;
	tracked.cutoff = cutoff && Promise.resolve(cutoff);
}

function readCutoff(tracked: TrackedStream): Promise<Cutoff> {
	if (tracked.cutoff) {
		return tracked.cutoff;
	}

	const read = findCutoff(tracked.room, tracked.uid);
	tracked.cutoff = read;
	void read.then(
		(cutoff) => {
			if (tracked.cutoff === read) {
				tracked.known = cutoff;
			}
		},
		() => {
			if (tracked.cutoff === read) {
				tracked.cutoff = undefined;
			}
		},
	);

	return read;
}

function track(publication: IPublication, room: StreamedRoom, uid: IUser['_id'], cutoff?: Cutoff): void {
	const tracked: TrackedStream = { room, uid };
	setCutoff(tracked, cutoff);

	const keys = [memberKey(room._id, uid), ...(room.prid ? [memberKey(room.prid, uid)] : [])];
	keys.forEach((key) => {
		const members = streamsByMember.get(key) ?? new Set();
		members.add(tracked);
		streamsByMember.set(key, members);

		publication.onStop(() => {
			members.delete(tracked);
			if (!members.size) {
				streamsByMember.delete(key);
			}
		});
	});

	const rooms = trackedByPublication.get(publication) ?? new Map();
	rooms.set(room._id, tracked);
	trackedByPublication.set(publication, rooms);
}

/** Lets a room stream subscription apply its user's cutoff in the room, without reading it until an event needs it. */
export function trackHistoryCutoff(publication: IPublication, room: StreamedRoom, uid: IUser['_id']): void {
	track(publication, room, uid);
}

/** Lets a user's room list stream apply their cutoffs, without reading them until an event needs them. */
export function trackRoomListCutoffs(publication: IPublication, uid: IUser['_id']): void {
	const roomList: TrackedRoomList = { publication, uid };
	roomListByPublication.set(publication, roomList);

	const roomLists = roomListsByUser.get(uid) ?? new Set();
	roomLists.add(roomList);
	roomListsByUser.set(uid, roomLists);
	publication.onStop(() => {
		roomLists.delete(roomList);
		if (!roomLists.size) {
			roomListsByUser.delete(uid);
		}
	});
}

function loadRoomList(roomList: TrackedRoomList): Promise<void> {
	roomList.loaded ??= Subscriptions.findWithHistoryVisibleFromByUserId(roomList.uid)
		.toArray()
		.then((subscriptions) => {
			const tracked = trackedByPublication.get(roomList.publication);
			subscriptions
				.filter(({ rid }) => !tracked?.has(rid))
				.forEach(({ rid, historyVisibleFrom }) =>
					track(roomList.publication, { _id: rid }, roomList.uid, { date: toCutoff(historyVisibleFrom), governingRid: rid }),
				);
		})
		.catch((error) => {
			roomList.loaded = undefined;
			throw error;
		});

	return roomList.loaded;
}

/** Applies a subscription change to the streams its user already has open. */
export function updateHistoryCutoff({
	rid,
	u,
	historyVisibleFrom,
}: Partial<Pick<ISubscription, 'rid' | 'u' | 'historyVisibleFrom'>>): void {
	if (!rid || !u) {
		return;
	}

	const cutoff: Cutoff = { date: toCutoff(historyVisibleFrom), governingRid: rid };

	streamsByMember.get(memberKey(rid, u._id))?.forEach((tracked) => {
		if (tracked.room._id === rid || tracked.known?.governingRid === rid) {
			setCutoff(tracked, cutoff);
			return;
		}

		if (!tracked.known) {
			setCutoff(tracked, undefined);
		}
	});

	roomListsByUser.get(u._id)?.forEach((roomList) => {
		if (roomList.loaded && !trackedByPublication.get(roomList.publication)?.has(rid)) {
			track(roomList.publication, { _id: rid }, u._id, cutoff);
		}
	});
}

async function findCutoffDate(publication: IPublication, rid: IRoom['_id']): Promise<Date | undefined> {
	const roomList = roomListByPublication.get(publication);
	if (roomList) {
		await loadRoomList(roomList);
	}

	const tracked = trackedByPublication.get(publication)?.get(rid);
	return tracked && (await readCutoff(tracked)).date;
}

async function isVisibleFrom(message: StreamedMessage, cutoff: Date, uid: IUser['_id']): Promise<boolean> {
	const sentAfterCutoff = new Date(message.ts) >= cutoff;

	if (!message.tmid) {
		return sentAfterCutoff || Boolean(message.replies?.includes(uid));
	}

	if (message.tshow && sentAfterCutoff) {
		return true;
	}

	const threadRoot = await Messages.findOneById<Pick<IMessage, 'ts' | 'replies'>>(message.tmid, { projection: { ts: 1, replies: 1 } });
	if (!threadRoot) {
		return sentAfterCutoff;
	}

	return new Date(threadRoot.ts) >= cutoff || Boolean(threadRoot.replies?.includes(uid));
}

/** Whether a room stream subscriber may receive an event about this message. */
export async function canReceiveMessage(
	publication: IPublication,
	rid: IRoom['_id'],
	message: StreamedMessage | undefined,
): Promise<boolean> {
	const uid = publication.userId;
	if (!message?.ts || !uid || !(await isEnabledFor(message))) {
		return true;
	}

	const cutoff = await findCutoffDate(publication, rid);
	return !cutoff || isVisibleFrom(message, cutoff, uid);
}

/**
 * Whether a user may receive an event about this message outside the room's own stream.
 * `subscription` is the user's in the message's room, or null when they aren't in it.
 */
export async function canMemberReceiveMessage(
	room: StreamedRoom,
	uid: IUser['_id'],
	message: StreamedMessage,
	subscription: Pick<ISubscription, 'historyVisibleFrom'> | null,
): Promise<boolean> {
	if (!message.ts || !(await isEnabledFor(message))) {
		return true;
	}

	const governing = subscription ?? (room.prid ? await findSubscriptionCutoff(room.prid, uid) : null);
	const cutoff = toCutoff(governing?.historyVisibleFrom);

	return !cutoff || isVisibleFrom(message, cutoff, uid);
}

/** The room as a stream subscriber may see it: without a last message from before their cutoff. */
export async function visibleRoom<T extends Pick<IRoom, '_id' | 'lastMessage'>>(publication: IPublication, room: T): Promise<T> {
	const uid = publication.userId;
	if (!uid || !room.lastMessage?.ts || !(await isEnabledFor(room))) {
		return room;
	}

	const cutoff = await findCutoffDate(publication, room._id);
	if (!cutoff || (await isVisibleFrom(room.lastMessage, cutoff, uid))) {
		return room;
	}

	const { lastMessage: _hidden, ...visible } = room;
	return visible as T;
}
