import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';

import { canRestrictMessageHistory } from '../../../lib/rooms/canRestrictMessageHistory';
import type { HistoryCheckedMessage } from '../../../server/lib/messages/historyVisibility';
import {
	getHiddenMessageIds,
	getHistoryVisibility,
	getHistoryVisibleFrom,
	getHistoryVisibleFromForNewMember,
	getMembersWithoutAccessToMessage,
} from '../../../server/lib/messages/historyVisibility';
import { settings } from '../../../server/settings';

type ThreadRoot = Pick<IMessage, 'ts' | 'replies'> | null;

const isActive = () => License.hasModule('experimental-enterprise-features') && settings.get<boolean>('Restricted_Message_History_Enabled');

const findSubscriptionCutoff = async (uid: IUser['_id'], rid: IRoom['_id']) =>
	Subscriptions.findOneByRoomIdAndUserId<Pick<ISubscription, 'historyVisibleFrom'>>(rid, uid, {
		projection: { historyVisibleFrom: 1 },
	});

/** A member's cutoff in a discussion they read through its parent room without being in the discussion. */
const findHistoryVisibleFromThroughParent = async (uid: IUser['_id'], rid: IRoom['_id']): Promise<Date | undefined> => {
	const room = await Rooms.findOneById<Pick<IRoom, 'prid'>>(rid, { projection: { prid: 1 } });
	if (!room?.prid) {
		return undefined;
	}

	return (await findSubscriptionCutoff(uid, room.prid))?.historyVisibleFrom;
};

/** A member's cutoff in a room; a discussion they read through its parent room takes their cutoff there. */
const findHistoryVisibleFrom = async (uid: IUser['_id'], rid: IRoom['_id']): Promise<Date | undefined> => {
	const subscription = await findSubscriptionCutoff(uid, rid);
	return subscription ? subscription.historyVisibleFrom : findHistoryVisibleFromThroughParent(uid, rid);
};

/** A member's cutoff in each of these rooms, read with one query for the rooms they are in. */
const findHistoryVisibleFromByRoom = async (uid: IUser['_id'], rids: IRoom['_id'][]): Promise<Map<IRoom['_id'], Date | undefined>> => {
	const subscriptions = await Subscriptions.findByUserIdAndRoomIds<Pick<ISubscription, 'rid' | 'historyVisibleFrom'>>(uid, rids, {
		projection: { rid: 1, historyVisibleFrom: 1 },
	}).toArray();
	const cutoffs = new Map<IRoom['_id'], Date | undefined>(subscriptions.map(({ rid, historyVisibleFrom }) => [rid, historyVisibleFrom]));

	await Promise.all(
		rids.filter((rid) => !cutoffs.has(rid)).map(async (rid) => cutoffs.set(rid, await findHistoryVisibleFromThroughParent(uid, rid))),
	);

	return cutoffs;
};

/** Thread roots looked up at most once while answering one question. */
const createThreadRootLoader = () => {
	const roots = new Map<IMessage['_id'], Promise<ThreadRoot>>();
	return (tmid: IMessage['_id']): Promise<ThreadRoot> => {
		const root = roots.get(tmid) ?? Messages.findOneById<Pick<IMessage, 'ts' | 'replies'>>(tmid, { projection: { ts: 1, replies: 1 } });
		roots.set(tmid, root);
		return root;
	};
};

const isVisibleFrom = async (
	message: HistoryCheckedMessage,
	since: Date,
	uid: IUser['_id'],
	getThreadRoot: (tmid: IMessage['_id']) => Promise<ThreadRoot>,
): Promise<boolean> => {
	const sentAfterCutoff = message.ts >= since;
	if (!message.tmid) {
		return sentAfterCutoff || Boolean(message.replies?.includes(uid));
	}

	if (message.tshow && sentAfterCutoff) {
		return true;
	}

	const threadRoot = await getThreadRoot(message.tmid);
	if (!threadRoot) {
		return sentAfterCutoff;
	}

	return threadRoot.ts >= since || Boolean(threadRoot.replies?.includes(uid));
};

getHistoryVisibleFrom.patch(async (next, uid, rid) => {
	if (!uid || !isActive()) {
		return next(uid, rid);
	}

	return findHistoryVisibleFrom(uid, rid);
});

getHistoryVisibility.patch(async (next, uid, rid) => {
	if (!uid || !isActive()) {
		return next(uid, rid);
	}

	const since = await findHistoryVisibleFrom(uid, rid);
	if (!since) {
		return undefined;
	}

	const [followedThreadIds, hiddenThreadIds] = await Promise.all([
		Messages.findThreadIdsStartedBeforeAndFollowedBy(rid, since, uid),
		Messages.findThreadIdsStartedBeforeAndActiveSinceNotFollowedBy(rid, since, uid),
	]);

	return { since, followedThreadIds, hiddenThreadIds };
});

getHiddenMessageIds.patch(async (next, uid, messages) => {
	if (!uid || !isActive() || !messages.length) {
		return next(uid, messages);
	}

	const cutoffs = await findHistoryVisibleFromByRoom(uid, [...new Set(messages.map(({ rid }) => rid))]);
	const getThreadRoot = createThreadRootLoader();

	const visibility = await Promise.all(
		messages.map(async (message) => {
			const since = cutoffs.get(message.rid);
			return !since || isVisibleFrom(message, since, uid, getThreadRoot);
		}),
	);

	return new Set(messages.filter((_, index) => !visibility[index]).map(({ _id }) => _id));
});

getMembersWithoutAccessToMessage.patch(async (next, message) => {
	if (!isActive()) {
		return next(message);
	}

	const restrictedMembers = await Subscriptions.findWithHistoryVisibleFromByRoomId(message.rid).toArray();
	const getThreadRoot = createThreadRootLoader();

	const visibility = await Promise.all(
		restrictedMembers.map(({ u, historyVisibleFrom }) =>
			historyVisibleFrom ? isVisibleFrom(message, historyVisibleFrom, u._id, getThreadRoot) : true,
		),
	);

	return new Set(restrictedMembers.filter((_, index) => !visibility[index]).map(({ u }) => u._id));
});

/** Someone restricted in a discussion's parent room stays restricted when they join the discussion. */
getHistoryVisibleFromForNewMember.patch(async (next, room, uid, joinedAt) => {
	if (!isActive() || !canRestrictMessageHistory(room)) {
		return next(room, uid, joinedAt);
	}

	if (room.hideHistoryForNewMembers) {
		return joinedAt;
	}

	return room.prid ? (await findSubscriptionCutoff(uid, room.prid))?.historyVisibleFrom : undefined;
});
