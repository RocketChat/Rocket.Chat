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

export const addUserToRoom = async function (
	rid: string,
	user: Pick<IUser, '_id' | 'username'> | string,
	inviter?: Pick<IUser, '_id' | 'username'>,
	silenced?: boolean,
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
		await callbacks.run('federation.beforeAddUserToARoom', { user, inviter }, room);
	} catch (error) {
		throw new Meteor.Error((error as any)?.message);
	}

	await callbacks.run('beforeAddedToRoom', { user: userToBeAdded, inviter: userToBeAdded });

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

	await Subscriptions.createWithRoomAndUser(room, userToBeAdded as IUser, {
		ts: now,
		open: true,
		alert: true,
		unread: 1,
		userMentions: 1,
		groupMentions: 0,
		...autoTranslateConfig,
		...getDefaultSubscriptionPref(userToBeAdded as IUser),
	});

	if (!userToBeAdded.username) {
		throw new Meteor.Error('error-invalid-user', 'Cannot add an user to a room without a username');
	}

	if (!silenced) {
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

	if (room.encrypted && settings.get('E2E_Enable')) {
		await Rooms.addUserIdToE2EEQueueByRoomIds([room._id], userToBeAdded._id);
	}

	return true;
};
