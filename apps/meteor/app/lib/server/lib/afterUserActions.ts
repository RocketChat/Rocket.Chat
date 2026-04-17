import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { notifyOnSubscriptionChangedByUserId } from './notifyListener';
import { callbacks } from '../../../../server/lib/callbacks';
import { unarchiveUserSubscriptions } from '../functions/unarchiveUserSubscriptions';

const handleDeactivateUser = async (user: IUser): Promise<void> => {
	const { modifiedCount } = await Subscriptions.setArchivedByUserId(user._id, true);
	if (modifiedCount) {
		void notifyOnSubscriptionChangedByUserId(user._id);
	}
};

const handleActivateUser = async (user: IUser): Promise<void> => {
	const unarchived = await unarchiveUserSubscriptions(user._id);
	if (unarchived) {
		void notifyOnSubscriptionChangedByUserId(user._id);
	}
};

callbacks.add('afterDeactivateUser', handleDeactivateUser, callbacks.priority.LOW, 'subscription-archive-on-deactivate');

callbacks.add('afterActivateUser', handleActivateUser, callbacks.priority.LOW, 'subscription-unarchive-on-activate');
