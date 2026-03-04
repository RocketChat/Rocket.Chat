import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms, Subscriptions, Users, Roles } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../app/authorization/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../app/authorization/server/functions/hasRole';
import { banUserFromRoom } from '../../app/lib/server/functions/banUserFromRoom';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		banUserFromRoom(data: { rid: string; username: string }): boolean;
	}
}

export const banUserFromRoomMethod = async (fromId: string, data: { rid: string; username: string }): Promise<boolean> => {
	if (!(await hasPermissionAsync(fromId, 'ban-user', data.rid))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'banUserFromRoom',
		});
	}

	const room = await Rooms.findOneById(data.rid);

	if (!room || !(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.BAN, fromId))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'banUserFromRoom',
		});
	}

	const fromUser = await Users.findOneById(fromId);
	if (!fromUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'banUserFromRoom',
		});
	}

	if (!(await canAccessRoomAsync(room, fromUser))) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	const bannedUser = await Users.findOneByUsernameIgnoringCase(data.username);
	if (!bannedUser) {
		throw new Meteor.Error('error-user-not-found', 'User not found', {
			method: 'banUserFromRoom',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(data.rid, bannedUser._id, {
		projection: { _id: 1, status: 1 },
	});
	if (!subscription) {
		throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
			method: 'banUserFromRoom',
		});
	}

	// Cannot ban a user who is already banned
	if (subscription.status === 'BANNED') {
		throw new Meteor.Error('error-user-already-banned', 'User is already banned from this room', {
			method: 'banUserFromRoom',
		});
	}

	// Cannot ban the last owner
	if (await hasRoleAsync(bannedUser._id, 'owner', room._id)) {
		const numOwners = await Roles.countUsersInRole('owner', room._id);

		if (numOwners === 1) {
			throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before banning the user.', {
				method: 'banUserFromRoom',
			});
		}
	}

	await banUserFromRoom(data.rid, bannedUser, { byUser: fromUser });

	return true;
};

Meteor.methods<ServerMethods>({
	async banUserFromRoom(data) {
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
				method: 'banUserFromRoom',
			});
		}

		return banUserFromRoomMethod(fromId, data);
	},
});
