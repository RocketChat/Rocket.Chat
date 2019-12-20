import { Meteor } from 'meteor/meteor';

import { Invites, Rooms, Users } from '../../../models';
import { validateInvite } from './validateInviteToken';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';

export const useInviteToken = (userId, token) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'The user is invalid', { method: 'useInviteToken', field: 'userId' });
	}

	if (!token) {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', { method: 'useInviteToken', field: 'token' });
	}

	const inviteData = Invites.findOneById(token);
	const room = inviteData && Rooms.findOneById(inviteData.rid, { fields: { _id: 1, fname: 1, t: 1 } });

	if (!validateInvite(inviteData, room)) {
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
