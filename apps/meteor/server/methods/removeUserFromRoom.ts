import { Message, Team } from '@rocket.chat/core-services';
import { Subscriptions, Rooms, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync, getUsersInRole } from '../../app/authorization/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../app/authorization/server/functions/hasRole';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';
import { callbacks } from '../../lib/callbacks';
import { afterRemoveFromRoomCallback } from '../../lib/callbacks/afterRemoveFromRoomCallback';
import { removeUserFromRolesAsync } from '../lib/roles/removeUserFromRoles';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

declare module '@rocket.chat/ui-contexts' {
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

	const canKickAnyUser = await hasPermissionAsync(fromId, kickAnyUserPermission, data.rid);
	if (!canKickAnyUser && !(await canAccessRoomAsync(room, fromUser))) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	const removedUser = await Users.findOneByUsernameIgnoringCase(data.username);

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
		const numOwners = await (await getUsersInRole('owner', room._id)).count();

		if (numOwners === 1) {
			throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
				method: 'removeUserFromRoom',
			});
		}
	}

	await Rooms.removeUsernameFromMutedAndUnmutedByRoomId(room._id, data.username);

	await callbacks.run('beforeRemoveFromRoom', { removedUser, userWhoRemoved: fromUser }, room);

	await Subscriptions.removeByRoomIdAndUserId(data.rid, removedUser._id);

	if (['c', 'p'].includes(room.t) === true) {
		await removeUserFromRolesAsync(removedUser._id, ['moderator', 'owner'], data.rid);
	}

	await Message.saveSystemMessage('ru', data.rid, removedUser.username || '', fromUser);

	if (room.teamId && room.teamMain) {
		// if a user is kicked from the main team room, delete the team membership
		await Team.removeMember(room.teamId, removedUser._id);
	}

	setImmediate(() => {
		void afterRemoveFromRoomCallback.run({ removedUser, userWhoRemoved: fromUser }, room);
	});

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
