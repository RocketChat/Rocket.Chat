import { Message } from '@rocket.chat/core-services';
import type { IUser, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnSubscriptionChangedById } from '../lib/notifyListener';

export const acceptRoomInvite = async (room: IRoom, subscription: ISubscription, user: IUser & { username: string }): Promise<void> => {
	if (subscription.status !== 'INVITED') {
		throw new Meteor.Error('error-not-invited', 'User was not invited to this room', {
			method: 'acceptRoomInvite',
		});
	}

	await callbacks.run('beforeJoinRoom', user, room);

	await Subscriptions.markInviteAsAccepted(subscription._id);

	void notifyOnSubscriptionChangedById(subscription._id, 'updated');

	await Message.saveSystemMessage('uj', room._id, user.username, user);

	await callbacks.run('afterJoinRoom', user, room);
};
