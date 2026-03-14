import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../server/lib/callbacks';
import { notifyOnSubscriptionChangedByUserId } from '../lib/notifyListener';

const handleDeactivateUser = async (user: IUser): Promise<void> => {
	const { modifiedCount } = await Subscriptions.setArchivedByUserId(user._id, true);
	if (modifiedCount) {
		void notifyOnSubscriptionChangedByUserId(user._id);
	}
};

const handleActivateUser = async (user: IUser): Promise<void> => {
	if (await Subscriptions.hasArchivedSubscriptionsInNonArchivedRoomsByUserId(user._id)) {
		await Subscriptions.unarchiveByUserIdExceptForArchivedRooms(user._id);
		void notifyOnSubscriptionChangedByUserId(user._id);
	}
};

callbacks.add('afterDeactivateUser', handleDeactivateUser, callbacks.priority.LOW, 'subscription-archive-on-deactivate');

callbacks.add('afterActivateUser', handleActivateUser, callbacks.priority.LOW, 'subscription-unarchive-on-activate');
