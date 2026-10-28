import { ClientSafeError, Message } from '@rocket.chat/core-services';
import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { isBannedSubscription } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { canRestrictMessageHistory } from '../../../../lib/rooms/canRestrictMessageHistory';
import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../../../server/lib/notifyListener';
import { assertCanAddUsersToRoom } from '../../../../server/meteor-methods/rooms/addUsersToRoom';
import { settings } from '../../../../server/settings';

/** Hides a member's earlier messages in a room, from the date they joined, or gives the full history back. */
export async function setMemberHistoryAccess(
	actor: Pick<IUser, '_id' | 'username' | 'name'>,
	{ rid, userId, restricted }: { rid: IRoom['_id']; userId: IUser['_id']; restricted: boolean },
): Promise<void> {
	if (!settings.get<boolean>('Restricted_Message_History_Enabled')) {
		throw new ClientSafeError('error-action-not-allowed', 'Restricted message history is disabled', { method: 'setMemberHistoryAccess' });
	}

	const room = await Rooms.findOneById(rid);
	if (!room || !canRestrictMessageHistory(room)) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'setMemberHistoryAccess' });
	}

	await assertCanAddUsersToRoom(actor._id, room);

	const subscription = await Subscriptions.findOneByRoomIdAndUserId<Pick<ISubscription, 'ts' | 'u' | 'status' | 'historyVisibleFrom'>>(
		rid,
		userId,
		{ projection: { ts: 1, u: 1, status: 1, historyVisibleFrom: 1 } },
	);
	if (!subscription || isBannedSubscription(subscription)) {
		throw new ClientSafeError('error-user-not-in-room', 'User is not in this room', { method: 'setMemberHistoryAccess' });
	}

	if (restricted === Boolean(subscription.historyVisibleFrom)) {
		return;
	}

	if (restricted) {
		await Subscriptions.setHistoryVisibleFromByRoomIdAndUserId(rid, userId, subscription.ts);
	} else {
		await Subscriptions.unsetHistoryVisibleFromByRoomIdAndUserId(rid, userId);
	}

	void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, userId);

	await Message.saveSystemMessage(
		restricted ? 'user-history-restricted' : 'user-history-restored',
		rid,
		subscription.u.username ?? '',
		actor,
	);
}
