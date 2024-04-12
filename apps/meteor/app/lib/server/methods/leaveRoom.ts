import type { IUser } from '@rocket.chat/core-typings';
import { Roles, Subscriptions, Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { removeUserFromRoom } from '../functions/removeUserFromRoom';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		leaveRoom(rid: string): Promise<void>;
	}
}

export const leaveRoomMethod = async (user: IUser, rid: string): Promise<void> => {
	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'leaveRoom' });
	}

	if (!user || !(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.LEAVE, user._id))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'leaveRoom' });
	}

	if (
		(room.t === 'c' && !(await hasPermissionAsync(user._id, 'leave-c'))) ||
		(room.t === 'p' && !(await hasPermissionAsync(user._id, 'leave-p')))
	) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'leaveRoom' });
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id, {
		projection: { _id: 1 },
	});
	if (!subscription) {
		throw new Meteor.Error('error-user-not-in-room', 'You are not in this room', {
			method: 'leaveRoom',
		});
	}

	// If user is room owner, check if there are other owners. If there isn't anyone else, warn user to set a new owner.
	if (await hasRoleAsync(user._id, 'owner', room._id)) {
		const cursor = await Roles.findUsersInRole('owner', room._id);
		const numOwners = await cursor.count();
		if (numOwners === 1) {
			throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
				method: 'leaveRoom',
			});
		}
	}

	return removeUserFromRoom(rid, user);
};

Meteor.methods<ServerMethods>({
	async leaveRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'leaveRoom' });
		}

		const user = (await Meteor.userAsync()) as unknown as IUser;

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'leaveRoom' });
		}

		return leaveRoomMethod(user, rid);
	},
});
