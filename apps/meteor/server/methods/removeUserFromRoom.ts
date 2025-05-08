import { Apps, AppEvents } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Message, Team, Room } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Rooms, Users, Roles } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../app/authorization/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../app/authorization/server/functions/hasRole';
import { notifyOnRoomChanged, notifyOnSubscriptionChanged } from '../../app/lib/server/lib/notifyListener';
import { settings } from '../../app/settings/server';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';
import { callbacks } from '../../lib/callbacks';
import { afterRemoveFromRoomCallback } from '../../lib/callbacks/afterRemoveFromRoomCallback';
import { removeUserFromRolesAsync } from '../lib/roles/removeUserFromRoles';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		removeUserFromRoom(data: { rid: string; username: string }): boolean;
	}
}

export const removeUserFromRoomMethod = async (fromId: string, data: { rid: string; username: string }): Promise<boolean> => {
	if (!(await hasPermissionAsync(fromId, 'remove-user', data.rid))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'removeUserFromRoom',
		});
	}

	const room = await Rooms.findOneById(data.rid);

	if (!room || !(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.REMOVE_USER, fromId))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'removeUserFromRoom',
		});
	}

	const fromUser = await Users.findOneById(fromId);
	if (!fromUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'removeUserFromRoom',
		});
	}

	// did this way so a ctrl-f would find the permission being used
	const kickAnyUserPermission = room.t === 'c' ? 'kick-user-from-any-c-room' : 'kick-user-from-any-p-room';

	const canKickAnyUser = await hasPermissionAsync(fromId, kickAnyUserPermission);
	if (!canKickAnyUser && !(await canAccessRoomAsync(room, fromUser))) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	const removedUser = await Users.findOneByUsernameIgnoringCase(data.username);
	if (!removedUser) {
		throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
			method: 'removeUserFromRoom',
		});
	}

	await Room.beforeUserRemoved(room);

	if (!canKickAnyUser) {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(data.rid, removedUser._id, {
			projection: { _id: 1 },
		});
		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'removeUserFromRoom',
			});
		}
	}

	if (await hasRoleAsync(removedUser._id, 'owner', room._id)) {
		const numOwners = await Roles.countUsersInRole('owner', room._id);

		if (numOwners === 1) {
			throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
				method: 'removeUserFromRoom',
			});
		}
	}

	try {
		await Apps.self?.triggerEvent(AppEvents.IPreRoomUserLeave, room, removedUser, fromUser);
	} catch (error: any) {
		if (error.name === AppsEngineException.name) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}

	await callbacks.run('beforeRemoveFromRoom', { removedUser, userWhoRemoved: fromUser }, room);

	const deletedSubscription = await Subscriptions.removeByRoomIdAndUserId(data.rid, removedUser._id);
	if (deletedSubscription) {
		void notifyOnSubscriptionChanged(deletedSubscription, 'removed');
	}

	if (['c', 'p'].includes(room.t) === true) {
		await removeUserFromRolesAsync(removedUser._id, ['moderator', 'owner'], data.rid);
	}

	await Message.saveSystemMessage('ru', data.rid, removedUser.username || '', fromUser);

	if (room.teamId && room.teamMain) {
		// if a user is kicked from the main team room, delete the team membership
		await Team.removeMember(room.teamId, removedUser._id);
	}

	if (room.encrypted && settings.get('E2E_Enable')) {
		await Rooms.removeUsersFromE2EEQueueByRoomId(room._id, [removedUser._id]);
	}

	setImmediate(() => {
		void afterRemoveFromRoomCallback.run({ removedUser, userWhoRemoved: fromUser }, room);
		void notifyOnRoomChanged(room);
	});

	await Apps.self?.triggerEvent(AppEvents.IPostRoomUserLeave, room, removedUser, fromUser);

	return true;
};

Meteor.methods<ServerMethods>({
	async removeUserFromRoom(data) {
		check(
			data,
			Match.ObjectIncluding({
				rid: String,
				username: String,
			}),
		);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeUserFromRoom',
			});
		}

		return removeUserFromRoomMethod(fromId, data);
	},
});
