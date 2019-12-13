import { Meteor } from 'meteor/meteor';

import { Invites, Rooms, Users } from '../../../models';
import { validateInviteToken } from './validateInviteToken';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';

export const useInviteToken = (userId, token) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'The user is invalid', { method: 'useInviteToken', field: 'userId' });
	}

	const inviteData = Invites.findOneByHash(token);
	const room = inviteData && Rooms.findOneById(inviteData.rid);

	if (!validateInviteToken(inviteData, room)) {
		throw new Meteor.Error('error-invalid-or-expired-token', 'The invite token is invalid or expired.', { method: 'useInviteToken', field: 'token' });
	}

	const user = Users.findOneById(userId);

	if (addUserToRoom(room._id, user)) {
		Invites.update(inviteData._id, {
			$inc: {
				uses: 1,
			},
		});
	}

	return {
		rid: inviteData.rid,
		roomName: room.fname,
		roomType: room.t,
	};
};
