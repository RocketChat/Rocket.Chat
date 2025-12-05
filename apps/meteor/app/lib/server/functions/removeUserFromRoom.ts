import { Apps, AppEvents } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Message, Team, Room } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { afterLeaveRoomCallback } from '../../../../lib/callbacks/afterLeaveRoomCallback';
import { beforeLeaveRoomCallback } from '../../../../lib/callbacks/beforeLeaveRoomCallback';
import { settings } from '../../../settings/server';
import { notifyOnRoomChangedById, notifyOnSubscriptionChanged } from '../lib/notifyListener';

/**
 * Removes a user from a room when triggered by federation or other external events.
 * Executes only the necessary database operations, with no callbacks, to prevent
 * propagation loops during external event processing.
 */
export const performUserRemoval = async function (rid: string, user: IUser, options?: { byUser?: IUser }): Promise<void> {
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id, {
		projection: { _id: 1, status: 1 },
	});
	if (!subscription) {
		return;
	}

	const room = await Rooms.findOneById(rid);

	if (!room) {
		return;
	}

	// TODO: move before callbacks to service
	await beforeLeaveRoomCallback.run(user, room);

	if (subscription) {
		const removedUser = user;
		if (options?.byUser) {
			const extraData = {
				u: options.byUser,
			};

			if (room.teamMain) {
				await Message.saveSystemMessage('removed-user-from-team', rid, user.username || '', user, extraData);
			} else {
				await Message.saveSystemMessage('ru', rid, user.username || '', user, extraData);
			}
		} else if (subscription.status === 'INVITED') {
			await Message.saveSystemMessage('uir', rid, removedUser.username || '', removedUser);
		} else if (room.teamMain) {
			await Message.saveSystemMessage('ult', rid, removedUser.username || '', removedUser);
		} else {
			await Message.saveSystemMessage('ul', rid, removedUser.username || '', removedUser);
		}
	}

	if (room.t === 'l') {
		await Message.saveSystemMessage('command', rid, 'survey', user);
	}

	const deletedSubscription = await Subscriptions.removeByRoomIdAndUserId(rid, user._id);
	if (deletedSubscription) {
		void notifyOnSubscriptionChanged(deletedSubscription, 'removed');
	}

	if (room.teamId && room.teamMain) {
		await Team.removeMember(room.teamId, user._id);
	}

	if (room.encrypted && settings.get('E2E_Enable')) {
		await Rooms.removeUsersFromE2EEQueueByRoomId(room._id, [user._id]);
	}

	void notifyOnRoomChangedById(rid);
};

/**
 * Removes a user from the given room by performing the required database updates
 * and triggering all standard callbacks. Used for local actions (UI or API)
 * that should propagate normally to federation and other subscribers.
 */
export const removeUserFromRoom = async function (rid: string, user: IUser, options?: { byUser: IUser }): Promise<void> {
	const room = await Rooms.findOneById(rid);
	if (!room) {
		return;
	}

	try {
		await Apps.self?.triggerEvent(AppEvents.IPreRoomUserLeave, room, user, options?.byUser);
	} catch (error: any) {
		if (error.name === AppsEngineException.name) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}

	await Room.beforeLeave(room);

	await performUserRemoval(rid, user, options);

	await afterLeaveRoomCallback.run({ user, kicker: options?.byUser }, room);

	await Apps.self?.triggerEvent(AppEvents.IPostRoomUserLeave, room, user, options?.byUser);
};
