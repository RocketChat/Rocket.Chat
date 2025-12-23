import { Apps, AppEvents } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Message, Team, Room } from '@rocket.chat/core-services';
import type { IRoom, IUser, MessageTypesValues } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { afterLeaveRoomCallback } from '../../../../server/lib/callbacks/afterLeaveRoomCallback';
import { beforeLeaveRoomCallback } from '../../../../server/lib/callbacks/beforeLeaveRoomCallback';
import { settings } from '../../../settings/server';
import { notifyOnRoomChangedById, notifyOnSubscriptionChanged } from '../lib/notifyListener';

/**
 * Removes a user from a room when triggered by federation or other external events.
 * Executes only the necessary database operations, with no callbacks, to prevent
 * propagation loops during external event processing.
 */
export const performUserRemoval = async function (
	room: IRoom,
	user: IUser,
	options?: { byUser?: IUser; skipAppPreEvents?: boolean; customSystemMessage?: MessageTypesValues },
): Promise<void> {
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, {
		projection: { _id: 1, status: 1 },
	});
	if (!subscription) {
		return;
	}

	// make TS happy, this should never happen
	if (!user.username) {
		throw new Error('User must have a username to be removed from the room');
	}

	// TODO: move before callbacks to service
	await beforeLeaveRoomCallback.run(user, room);

	if (subscription) {
		if (options?.customSystemMessage) {
			await Message.saveSystemMessage(options?.customSystemMessage, room._id, user.username || '', user);
		} else if (options?.byUser) {
			const extraData = {
				u: options.byUser,
			};

			if (room.teamMain) {
				await Message.saveSystemMessage('removed-user-from-team', room._id, user.username, user, extraData);
			} else {
				await Message.saveSystemMessage('ru', room._id, user.username, user, extraData);
			}
		} else if (subscription.status === 'INVITED') {
			await Message.saveSystemMessage('uir', room._id, user.username, user);
		} else if (room.teamMain) {
			await Message.saveSystemMessage('ult', room._id, user.username, user);
		} else {
			await Message.saveSystemMessage('ul', room._id, user.username, user);
		}
	}

	if (room.t === 'l') {
		await Message.saveSystemMessage('command', room._id, 'survey', user);
	}

	const deletedSubscription = await Subscriptions.removeByRoomIdAndUserId(room._id, user._id);
	if (deletedSubscription) {
		void notifyOnSubscriptionChanged(deletedSubscription, 'removed');
	}

	if (room.teamId && room.teamMain) {
		await Team.removeMember(room.teamId, user._id);
	}

	if (room.encrypted && settings.get('E2E_Enable')) {
		await Rooms.removeUsersFromE2EEQueueByRoomId(room._id, [user._id]);
	}

	// remove references to the user in direct message rooms
	if (room.t === 'd') {
		await Rooms.removeUserReferenceFromDMsById(room._id, user.username, user._id);
	}

	void notifyOnRoomChangedById(room._id);
};

/**
 * Removes a user from the given room by performing the required database updates
 * and triggering all standard callbacks. Used for local actions (UI or API)
 * that should propagate normally to federation and other subscribers.
 */
export const removeUserFromRoom = async function (
	rid: string,
	user: IUser,
	options?: { byUser?: IUser; skipAppPreEvents?: boolean; customSystemMessage?: MessageTypesValues },
): Promise<void> {
	const room = await Rooms.findOneById(rid);
	if (!room) {
		return;
	}

	// Rationale: for an abac room, we don't want apps to be able to prevent a user from leaving
	if (!options?.skipAppPreEvents) {
		try {
			await Apps.self?.triggerEvent(AppEvents.IPreRoomUserLeave, room, user, options?.byUser);
		} catch (error: any) {
			if (error.name === AppsEngineException.name) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}
	}

	await Room.beforeLeave(room);

	await performUserRemoval(room, user, options);

	await afterLeaveRoomCallback.run({ user, kicker: options?.byUser }, room);

	await Apps.self?.triggerEvent(AppEvents.IPostRoomUserLeave, room, user, options?.byUser);
};
