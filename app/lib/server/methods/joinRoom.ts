import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission, canAccessRoom } from '../../../authorization/server';
import { Rooms } from '../../../models/server';
import { Tokenpass, updateUserTokenpassBalances } from '../../../tokenpass/server';
import { addUserToRoom } from '../functions';
import { roomTypes, RoomMemberActions } from '../../../utils/server';

Meteor.methods({
	joinRoom(rid, code) {
		check(rid, String);

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
		}

		if (!roomTypes.getConfig(room.t).allowMemberAction(room, RoomMemberActions.JOIN)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
		}

		// TODO we should have a 'beforeJoinRoom' call back so external services can do their own validations

		if (room.tokenpass && user && user.services && user.services.tokenpass) {
			const balances = updateUserTokenpassBalances(user);

			if (!Tokenpass.validateAccess(room.tokenpass, balances)) {
				throw new Meteor.Error('error-not-allowed', 'Token required', { method: 'joinRoom' });
			}
		} else {
			if (!canAccessRoom(room, user)) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
			}
			if (room.joinCodeRequired === true && code !== room.joinCode && !hasPermission(user._id, 'join-without-join-code')) {
				throw new Meteor.Error('error-code-invalid', 'Invalid Room Password', {
					method: 'joinRoom',
				});
			}
		}

		return addUserToRoom(rid, user);
	},
});
