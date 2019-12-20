import { Meteor } from 'meteor/meteor';

import { Invites, Rooms, Users } from '../../../models';
import { validateInviteToken } from './validateInviteToken';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';

export const useInviteToken = (userId, token) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'The user is invalid', { method: 'useInviteToken', field: 'userId' });
	}

	if (!token) {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', { method: 'useInviteToken', field: 'token' });
	}

	const { inviteData, room } = validateInviteToken(token);

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
		fname: room.fname,
		t: room.t,
	};
};
