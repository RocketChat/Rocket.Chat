import { Apps, AppEvents } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Message } from '@rocket.chat/core-services';
import type { IUser, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../server/lib/callbacks';
import { notifyOnSubscriptionChangedById } from '../lib/notifyListener';

/**
 * Accepts a room invite when triggered by internal events such as federation
 * or third-party callbacks. Performs the necessary database updates and triggers
 * safe callbacks, ensuring no propagation loops are created during external event
 * processing.
 */

// TODO this funcion is pretty much the same as the one in addUserToRoom.ts, we should probably
// unify them at some point
export const performAcceptRoomInvite = async (
	room: IRoom,
	subscription: ISubscription,
	user: IUser & { username: string },
): Promise<void> => {
	if (subscription.status !== 'INVITED' || !subscription.inviter) {
		throw new Meteor.Error('error-not-invited', `User was not invited to this room ${subscription.status}`);
	}
	const inviter = await Users.findOneById(subscription.inviter._id);

	await callbacks.run('beforeJoinRoom', user, room);

	await callbacks.run('beforeAddedToRoom', { user, inviter }, room);

	try {
		await Apps.self?.triggerEvent(AppEvents.IPreRoomUserJoined, room, user, inviter);
	} catch (error: any) {
		if (error.name === AppsEngineException.name) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}

	await Subscriptions.acceptInvitationById(subscription._id);

	void notifyOnSubscriptionChangedById(subscription._id, 'updated');

	await Message.saveSystemMessage('uj', room._id, user.username, user);

	if (room.t === 'c' || room.t === 'p') {
		process.nextTick(async () => {
			// Add a new event, with an optional inviter
			await callbacks.run('afterAddedToRoom', { user, inviter }, room);

			// Keep the current event
			await callbacks.run('afterJoinRoom', user, room);

			void Apps.self?.triggerEvent(AppEvents.IPostRoomUserJoined, room, user, inviter);
		});
	}
};
