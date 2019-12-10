import { Meteor } from 'meteor/meteor';

import { Invites, Rooms, Subscriptions, Users } from '../../../models';

export const useInviteToken = (userId, token) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'The user is invalid', { method: 'useInviteToken', field: 'userId' });
	}
	if (!token) {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', { method: 'useInviteToken', field: 'token' });
	}

	const inviteData = Invites.findOneByHash(token);
	if (!inviteData) {
		throw new Meteor.Error('error-invalid-invite', 'The invite token is invalid.', { method: 'useInviteToken', field: 'token' });
	}

	const room = Rooms.findOneById(inviteData.rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'The invite room is invalid', { method: 'useInviteToken', field: 'rid' });
	}

	Invites.update(inviteData._id, {
		$inc: {
			uses: 1,
		},
	});

	const user = Users.findOneById(userId);

	if (!Subscriptions.findOneByRoomIdAndUserId(room._id, user._id)) {
		Subscriptions.createWithRoomAndUser(room, user, {
			ts: new Date(),
			open: true,
			alert: true,
			unread: 1,
			userMentions: 1,
			groupMentions: 0,
		});
	}

	return {
		rid: inviteData.rid,
		roomName: room.fname,
	};
};
