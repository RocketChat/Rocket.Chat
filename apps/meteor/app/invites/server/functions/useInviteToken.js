import { Meteor } from 'meteor/meteor';

import { Users, Subscriptions } from '../../../models/server';
import { Invites } from '../../../models/server/raw';
import { validateInviteToken } from './validateInviteToken';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

export const useInviteToken = async (userId, token) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'The user is invalid', {
			method: 'useInviteToken',
			field: 'userId',
		});
	}

	if (!token) {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', {
			method: 'useInviteToken',
			field: 'token',
		});
	}

	const { inviteData, room } = await validateInviteToken(token);

	if (!roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.INVITE)) {
		throw new Meteor.Error('error-room-type-not-allowed', "Can't join room of this type via invite", {
			method: 'useInviteToken',
			field: 'token',
		});
	}

	const user = Users.findOneById(userId);
	Users.updateInviteToken(user._id, token);

	const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, {
		fields: { _id: 1 },
	});
	if (!subscription) {
		await Invites.increaseUsageById(inviteData._id);
	}

	// If the user already has an username, then join the invite room,
	// If no username is set yet, then the the join will happen on the setUsername method
	if (user.username) {
		addUserToRoom(room._id, user);
	}

	return {
		room: {
			rid: inviteData.rid,
			prid: room.prid,
			fname: room.fname,
			name: room.name,
			t: room.t,
		},
	};
};
