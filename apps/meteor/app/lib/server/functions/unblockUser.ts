import { Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedByRoomIdAndUserIds } from '../lib/notifyListener';

export const unblockUserMethod = async (userId: string, { rid, blocked }: { rid: string; blocked: string }): Promise<void> => {
	const [blockedUser, blockerUser] = await Promise.all([
		Subscriptions.findOneByRoomIdAndUserId(rid, blocked, { projection: { _id: 1 } }),
		Subscriptions.findOneByRoomIdAndUserId(rid, userId, { projection: { _id: 1 } }),
	]);

	if (!blockedUser || !blockerUser) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'unblockUser' });
	}

	const [blockedResponse, blockerResponse] = await Subscriptions.unsetBlockedByRoomId(rid, blocked, userId);

	const listenerUsers = [...(blockedResponse?.modifiedCount ? [blocked] : []), ...(blockerResponse?.modifiedCount ? [userId] : [])];

	if (listenerUsers.length) {
		void notifyOnSubscriptionChangedByRoomIdAndUserIds(rid, listenerUsers);
	}
};
