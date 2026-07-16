import { Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../lib/notifyListener';

export const hideRoomMethod = async (userId: string, rid: string): Promise<number> => {
	check(rid, String);

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'hideRoom',
		});
	}

	const { modifiedCount } = await Subscriptions.hideByRoomIdAndUserId(rid, userId);

	if (modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, userId);
	}

	return modifiedCount;
};
