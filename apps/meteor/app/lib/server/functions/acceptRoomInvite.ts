import { Message } from '@rocket.chat/core-services';
import type { IUser, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnSubscriptionChangedById } from '../lib/notifyListener';

/**
 * Accepts a room invite when triggered by internal events such as federation
 * or third-party callbacks. Performs the necessary database updates and triggers
 * safe callbacks, ensuring no propagation loops are created during external event
 * processing.
 */
export const performAcceptRoomInvite = async (
	room: IRoom,
	subscription: ISubscription,
	user: IUser & { username: string },
): Promise<void> => {
	if (subscription.status !== 'INVITED') {
		throw new Meteor.Error('error-not-invited', 'User was not invited to this room');
	}

	await callbacks.run('beforeJoinRoom', user, room);

	await Subscriptions.markInviteAsAccepted(subscription._id);

	void notifyOnSubscriptionChangedById(subscription._id, 'updated');

	await Message.saveSystemMessage('uj', room._id, user.username, user);
};

/**
 * Accepts a room invite initiated locally - via UI or API calls - performing full
 * database updates and triggering all standard callbacks. These callbacks are
 * expected to propagate normally to other parts of the system.
 */
export const acceptRoomInvite = async (room: IRoom, subscription: ISubscription, user: IUser & { username: string }): Promise<void> => {
	if (subscription.status !== 'INVITED') {
		throw new Meteor.Error('error-not-invited', 'User was not invited to this room', {
			method: 'acceptRoomInvite',
		});
	}

	await performAcceptRoomInvite(room, subscription, user);

	await callbacks.run('afterJoinRoom', user, room);
};
