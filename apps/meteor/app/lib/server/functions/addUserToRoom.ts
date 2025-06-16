import { Apps, AppEvents } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Message, Team } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Users, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { callbacks } from '../../../../lib/callbacks';
import { getSubscriptionAutotranslateDefaultConfig } from '../../../../server/lib/getSubscriptionAutotranslateDefaultConfig';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { settings } from '../../../settings/server';
import { getDefaultSubscriptionPref } from '../../../utils/lib/getDefaultSubscriptionPref';
import { notifyOnRoomChangedById, notifyOnSubscriptionChangedById } from '../lib/notifyListener';

/**
 * This function adds user to the given room.
 * Caution - It does not validates if the user has permission to join room
 */
export const addUserToRoom = async function (
	rid: string,
	user: Pick<IUser, '_id'> | string,
	inviter?: Pick<IUser, '_id' | 'username'>,
	{
		skipSystemMessage,
		skipAlertSound,
		createAsHidden = false,
	}: {
		skipSystemMessage?: boolean;
		skipAlertSound?: boolean;
		createAsHidden?: boolean;
	} = {},
): Promise<boolean | undefined> {
	const now = new Date();
	const room = await Rooms.findOneById(rid);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'addUserToRoom',
		});
	}

	const userToBeAdded = typeof user === 'string' ? await Users.findOneByUsername(user.replace('@', '')) : await Users.findOneById(user._id);
	const roomDirectives = roomCoordinator.getRoomDirectives(room.t);

	if (!userToBeAdded) {
		throw new Meteor.Error('user-not-found');
	}

	if (
		!(await roomDirectives.allowMemberAction(room, RoomMemberActions.JOIN, userToBeAdded._id)) &&
		!(await roomDirectives.allowMemberAction(room, RoomMemberActions.INVITE, userToBeAdded._id))
	) {
		return;
	}

	try {
		await callbacks.run('federation.beforeAddUserToARoom', { user: userToBeAdded, inviter }, room);
	} catch (error) {
		throw new Meteor.Error((error as any)?.message);
	}

	await callbacks.run('beforeAddedToRoom', { user: userToBeAdded, inviter });

	// Check if user is already in room
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userToBeAdded._id);
	if (subscription || !userToBeAdded) {
		return;
	}

	try {
		await Apps.self?.triggerEvent(AppEvents.IPreRoomUserJoined, room, userToBeAdded, inviter);
	} catch (error: any) {
		if (error.name === AppsEngineException.name) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}

	if (room.t === 'c' || room.t === 'p' || room.t === 'l') {
		// Add a new event, with an optional inviter
		await callbacks.run('beforeAddedToRoom', { user: userToBeAdded, inviter }, room);

		// Keep the current event
		await callbacks.run('beforeJoinRoom', userToBeAdded, room);
	}

	const autoTranslateConfig = getSubscriptionAutotranslateDefaultConfig(userToBeAdded);

	const { insertedId } = await Subscriptions.createWithRoomAndUser(room, userToBeAdded as IUser, {
		ts: now,
		open: !createAsHidden,
		alert: createAsHidden ? false : !skipAlertSound,
		unread: 1,
		userMentions: 1,
		groupMentions: 0,
		...autoTranslateConfig,
		...getDefaultSubscriptionPref(userToBeAdded as IUser),
	});

	if (insertedId) {
		void notifyOnSubscriptionChangedById(insertedId, 'inserted');
	}

	if (!userToBeAdded.username) {
		throw new Meteor.Error('error-invalid-user', 'Cannot add an user to a room without a username');
	}

	if (!skipSystemMessage) {
		if (inviter) {
			const extraData = {
				ts: now,
				u: {
					_id: inviter._id,
					username: inviter.username,
				},
			};
			if (room.teamMain) {
				await Message.saveSystemMessage('added-user-to-team', rid, userToBeAdded.username, userToBeAdded, extraData);
			} else {
				await Message.saveSystemMessage('au', rid, userToBeAdded.username, userToBeAdded, extraData);
			}
		} else if (room.prid) {
			await Message.saveSystemMessage('ut', rid, userToBeAdded.username, userToBeAdded, { ts: now });
		} else if (room.teamMain) {
			await Message.saveSystemMessage('ujt', rid, userToBeAdded.username, userToBeAdded, { ts: now });
		} else {
			await Message.saveSystemMessage('uj', rid, userToBeAdded.username, userToBeAdded, { ts: now });
		}
	}

	if (room.t === 'c' || room.t === 'p') {
		process.nextTick(async () => {
			// Add a new event, with an optional inviter
			await callbacks.run('afterAddedToRoom', { user: userToBeAdded, inviter }, room);

			// Keep the current event
			await callbacks.run('afterJoinRoom', userToBeAdded, room);

			void Apps.self?.triggerEvent(AppEvents.IPostRoomUserJoined, room, userToBeAdded, inviter);
		});
	}

	if (room.teamMain && room.teamId) {
		// if user is joining to main team channel, create a membership
		await Team.addMember(inviter || userToBeAdded, userToBeAdded._id, room.teamId);
	}

	if (room.encrypted && settings.get('E2E_Enable') && userToBeAdded.e2e?.public_key) {
		await Rooms.addUserIdToE2EEQueueByRoomIds([room._id], userToBeAdded._id);
	}

	void notifyOnRoomChangedById(rid);
	return true;
};
