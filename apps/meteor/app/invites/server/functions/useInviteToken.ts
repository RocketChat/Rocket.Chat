import { Invites, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';
import { validateInviteToken } from './validateInviteToken';

export const useInviteToken = async (userId: string, token: string) => {
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

	if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.INVITE, userId))) {
		throw new Meteor.Error('error-room-type-not-allowed', "Can't join room of this type via invite", {
			method: 'useInviteToken',
			field: 'token',
		});
	}

	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'The user is invalid', {
			method: 'useInviteToken',
			field: 'userId',
		});
	}
	await Users.updateInviteToken(user._id, token);

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, {
		projection: { _id: 1 },
	});
	if (!subscription) {
		await Invites.increaseUsageById(inviteData._id, 1);
	}

	// If the user already has an username, then join the invite room,
	// If no username is set yet, then the the join will happen on the setUsername method
	if (user.username) {
		await addUserToRoom(room._id, user);
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
