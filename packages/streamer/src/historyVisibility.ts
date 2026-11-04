import { Settings } from '@rocket.chat/core-services';
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';

import type { IPublication } from './types';

type StreamedMessage = Pick<IMessage, 'ts' | 'tmid' | 'tshow' | 'replies'>;

type TrackedStream = { publication: IPublication; cutoff?: Date };

const streamsByMember = new Map<string, Set<TrackedStream>>();
const trackedByPublication = new WeakMap<IPublication, Map<IRoom['_id'], TrackedStream>>();
const roomListsByUser = new Map<IUser['_id'], Set<IPublication>>();

const memberKey = (rid: IRoom['_id'], uid: IUser['_id']) => `${rid}:${uid}`;

const toCutoff = (historyVisibleFrom: ISubscription['historyVisibleFrom']) =>
	historyVisibleFrom ? new Date(historyVisibleFrom) : undefined;

const isEnabled = async () => Boolean(await Settings.get<boolean>('Restricted_Message_History_Enabled'));

const findSubscriptionCutoff = (rid: IRoom['_id'], uid: IUser['_id']) =>
	Subscriptions.findOneByRoomIdAndUserId<Pick<ISubscription, 'rid' | 'historyVisibleFrom'>>(rid, uid, {
		projection: { rid: 1, historyVisibleFrom: 1 },
	});

/** The subscription whose cutoff applies: the member's own, or their parent room's for a discussion they read through it. */
async function findGoverningSubscription(rid: IRoom['_id'], uid: IUser['_id']) {
	const subscription = await findSubscriptionCutoff(rid, uid);
	if (subscription) {
		return subscription;
	}

	const room = await Rooms.findOneById<Pick<IRoom, 'prid'>>(rid, { projection: { prid: 1 } });
	return room?.prid ? findSubscriptionCutoff(room.prid, uid) : null;
}

function track(publication: IPublication, rid: IRoom['_id'], uid: IUser['_id'], cutoff: Date | undefined, governingRid = rid): void {
	const tracked: TrackedStream = { publication, cutoff };
	const key = memberKey(governingRid, uid);

	const members = streamsByMember.get(key) ?? new Set();
	members.add(tracked);
	streamsByMember.set(key, members);

	const rooms = trackedByPublication.get(publication) ?? new Map();
	rooms.set(rid, tracked);
	trackedByPublication.set(publication, rooms);

	publication.onStop(() => {
		members.delete(tracked);
		if (!members.size) {
			streamsByMember.delete(key);
		}
	});
}

/** Remembers, for the lifetime of a room stream subscription, the date its user can read the room from. */
export async function trackHistoryCutoff(publication: IPublication, rid: IRoom['_id'], uid: IUser['_id']): Promise<void> {
	const subscription = await findGoverningSubscription(rid, uid);
	track(publication, rid, uid, toCutoff(subscription?.historyVisibleFrom), subscription?.rid ?? rid);
}

/** Remembers, for the lifetime of a user's room list stream, the rooms where they have a cutoff. */
export async function trackRoomListCutoffs(publication: IPublication, uid: IUser['_id']): Promise<void> {
	const roomLists = roomListsByUser.get(uid) ?? new Set();
	roomLists.add(publication);
	roomListsByUser.set(uid, roomLists);
	publication.onStop(() => {
		roomLists.delete(publication);
		if (!roomLists.size) {
			roomListsByUser.delete(uid);
		}
	});

	const subscriptions = await Subscriptions.findWithHistoryVisibleFromByUserId(uid).toArray();
	subscriptions.forEach(({ rid, historyVisibleFrom }) => track(publication, rid, uid, toCutoff(historyVisibleFrom)));
}

/** Applies a subscription change to the room streams its user already has open. */
export function updateHistoryCutoff({
	rid,
	u,
	historyVisibleFrom,
}: Partial<Pick<ISubscription, 'rid' | 'u' | 'historyVisibleFrom'>>): void {
	if (!rid || !u) {
		return;
	}

	const cutoff = toCutoff(historyVisibleFrom);
	streamsByMember.get(memberKey(rid, u._id))?.forEach((tracked) => {
		tracked.cutoff = cutoff;
	});

	if (cutoff) {
		roomListsByUser.get(u._id)?.forEach((publication) => {
			if (!trackedByPublication.get(publication)?.has(rid)) {
				track(publication, rid, u._id, cutoff);
			}
		});
	}
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
	const cutoff = trackedByPublication.get(publication)?.get(rid)?.cutoff;
	if (!cutoff || !message?.ts || !publication.userId) {
		return true;
	}

	if (!(await isEnabled())) {
		return true;
	}

	return isVisibleFrom(message, cutoff, publication.userId);
}

/** Whether a user may receive an event about this message outside the room's own stream. */
export async function canMemberReceiveMessage(rid: IRoom['_id'], uid: IUser['_id'], message: StreamedMessage): Promise<boolean> {
	if (!message.ts || !(await isEnabled())) {
		return true;
	}

	const subscription = await findGoverningSubscription(rid, uid);
	const cutoff = toCutoff(subscription?.historyVisibleFrom);

	return !cutoff || isVisibleFrom(message, cutoff, uid);
}

/** The room as a stream subscriber may see it: without a last message from before their cutoff. */
export async function visibleRoom<T extends Pick<IRoom, '_id' | 'lastMessage'>>(publication: IPublication, room: T): Promise<T> {
	const cutoff = trackedByPublication.get(publication)?.get(room._id)?.cutoff;
	const uid = publication.userId;
	if (!cutoff || !uid || !room.lastMessage?.ts || !(await isEnabled()) || (await isVisibleFrom(room.lastMessage, cutoff, uid))) {
		return room;
	}

	const { lastMessage: _hidden, ...visible } = room;
	return visible as T;
}
