import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../server/lib/callbacks';
import { unarchiveUserSubscriptions } from '../functions/unarchiveUserSubscriptions';
import { notifyOnSubscriptionChangedByUserId } from '../lib/notifyListener';

/**
 * When a user is deactivated, archive all their subscriptions so they
 * no longer appear in read-receipt counts and active member lists.
 */
const handleDeactivateUser = async (user: IUser): Promise<void> => {
	const { modifiedCount } = await Subscriptions.setArchivedByUserId(user._id, true);
	if (modifiedCount) {
		void notifyOnSubscriptionChangedByUserId(user._id);
	}
};

/**
 * When a user is reactivated, restore their subscriptions — except for
 * rooms that are themselves archived (those should stay archived).
 */
const handleActivateUser = async (user: IUser): Promise<void> => {
	const unarchived = await unarchiveUserSubscriptions(user._id);
	if (unarchived) {
		void notifyOnSubscriptionChangedByUserId(user._id);
	}
};

callbacks.add('afterDeactivateUser', handleDeactivateUser, callbacks.priority.LOW, 'subscription-archive-on-deactivate');

callbacks.add('afterActivateUser', handleActivateUser, callbacks.priority.LOW, 'subscription-unarchive-on-activate');
