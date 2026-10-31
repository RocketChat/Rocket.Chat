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

/** A member's cutoff in a room; a discussion they read through its parent room takes their cutoff there. */
const findHistoryVisibleFrom = async (uid: IUser['_id'], rid: IRoom['_id']): Promise<Date | undefined> => {
	const subscription = await findSubscriptionCutoff(uid, rid);
	if (subscription) {
		return subscription.historyVisibleFrom;
	}

	const room = await Rooms.findOneById<Pick<IRoom, 'prid'>>(rid, { projection: { prid: 1 } });
	if (!room?.prid) {
		return undefined;
	}

	return (await findSubscriptionCutoff(uid, room.prid))?.historyVisibleFrom;
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

	const cutoffs = new Map<IRoom['_id'], Promise<Date | undefined>>();
	const getCutoff = (rid: IRoom['_id']) => {
		const cutoff = cutoffs.get(rid) ?? findHistoryVisibleFrom(uid, rid);
		cutoffs.set(rid, cutoff);
		return cutoff;
	};
	const getThreadRoot = createThreadRootLoader();

	const visibility = await Promise.all(
		messages.map(async (message) => {
			const since = await getCutoff(message.rid);
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

getHistoryVisibleFromForNewMember.patch(async (next, room, joinedAt) => {
	if (!isActive() || !room.hideHistoryForNewMembers || !canRestrictMessageHistory(room)) {
		return next(room, joinedAt);
	}

	return joinedAt;
});
