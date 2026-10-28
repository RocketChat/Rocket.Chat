import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Messages, Subscriptions } from '@rocket.chat/models';

import { follow } from './functions';
import { canAccessRoomIdAsync } from '../../authorization/canAccessRoom';
import type { HistoryCheckedMessage } from '../../messages/historyVisibility';
import { canSeeMessage, getMembersWithoutAccessToMessage, historyCheckedMessageProjection } from '../../messages/historyVisibility';
import { notifyOnMessageChange, notifyOnSubscriptionChangedByRoomIdAndUserIds } from '../../notifyListener';

/**
 * Lets members whose history restriction hides a thread read it, by making them follow it, and marks it unread for them.
 * Anyone who can read the thread may do it. Returns the members who got access.
 */
export async function giveThreadAccess(actorId: IUser['_id'], tmid: IMessage['_id'], userIds: IUser['_id'][]): Promise<IUser['_id'][]> {
	const threadRoot = await Messages.findOneById<HistoryCheckedMessage>(tmid, { projection: historyCheckedMessageProjection });
	if (!threadRoot || !(await canAccessRoomIdAsync(threadRoot.rid, actorId)) || !(await canSeeMessage(actorId, threadRoot))) {
		throw new ClientSafeError('error-not-allowed', 'Not allowed', { method: 'giveThreadAccess' });
	}

	const membersWithoutAccess = await getMembersWithoutAccessToMessage(threadRoot);
	const grantedIds = userIds.filter((userId) => membersWithoutAccess.has(userId));
	if (!grantedIds.length) {
		return [];
	}

	await Promise.all(grantedIds.map((uid) => follow({ tmid, uid })));
	await Subscriptions.addUnreadThreadByRoomIdAndUserIds(threadRoot.rid, grantedIds, tmid, { userMention: true });

	void notifyOnSubscriptionChangedByRoomIdAndUserIds(threadRoot.rid, grantedIds);
	void notifyOnMessageChange({ id: tmid });

	return grantedIds;
}
