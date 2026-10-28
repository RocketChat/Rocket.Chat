import { Settings } from '@rocket.chat/core-services';
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Messages, Subscriptions } from '@rocket.chat/models';

import type { IPublication } from './types';

type StreamedMessage = Pick<IMessage, 'ts' | 'tmid' | 'tshow' | 'replies'>;

type TrackedStream = { publication: IPublication; cutoff?: Date };

const streamsByMember = new Map<string, Set<TrackedStream>>();
const trackedByPublication = new WeakMap<IPublication, Map<IRoom['_id'], TrackedStream>>();

const memberKey = (rid: IRoom['_id'], uid: IUser['_id']) => `${rid}:${uid}`;

const toCutoff = (historyVisibleFrom: ISubscription['historyVisibleFrom']) =>
	historyVisibleFrom ? new Date(historyVisibleFrom) : undefined;

const isEnabled = async () => Boolean(await Settings.get<boolean>('Restricted_Message_History_Enabled'));

/** Remembers, for the lifetime of a room stream subscription, the date its user can read the room from. */
export async function trackHistoryCutoff(publication: IPublication, rid: IRoom['_id'], uid: IUser['_id']): Promise<void> {
	const subscription = await Subscriptions.findOneByRoomIdAndUserId<Pick<ISubscription, 'historyVisibleFrom'>>(rid, uid, {
		projection: { historyVisibleFrom: 1 },
	});

	const tracked: TrackedStream = { publication, cutoff: toCutoff(subscription?.historyVisibleFrom) };
	const key = memberKey(rid, uid);

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

/** Whether a room member may receive an event about this message outside the room's own stream. */
export async function canMemberReceiveMessage(rid: IRoom['_id'], uid: IUser['_id'], message: StreamedMessage): Promise<boolean> {
	if (!message.ts || !(await isEnabled())) {
		return true;
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId<Pick<ISubscription, 'historyVisibleFrom'>>(rid, uid, {
		projection: { historyVisibleFrom: 1 },
	});
	const cutoff = toCutoff(subscription?.historyVisibleFrom);

	return !cutoff || isVisibleFrom(message, cutoff, uid);
}
