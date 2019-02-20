import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Users, Subscriptions, Rooms, Messages } from 'meteor/rocketchat:models';

Meteor.methods({
	unmuteUserInRoom(data) {
		const fromId = Meteor.userId();

		check(data, Match.ObjectIncluding({
			rid: String,
			username: String,
		}));

		if (!hasPermission(fromId, 'mute-user', data.rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'unmuteUserInRoom',
			});
		}

		const room = Rooms.findOneById(data.rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'unmuteUserInRoom',
			});
		}

		if (['c', 'p'].includes(room.t) === false) {
			throw new Meteor.Error('error-invalid-room-type', `${ room.t } is not a valid room type`, {
				method: 'unmuteUserInRoom',
				type: room.t,
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUsername(data.rid, data.username, { fields: { _id: 1 } });
		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'unmuteUserInRoom',
			});
		}

		const unmutedUser = Users.findOneByUsername(data.username);

		Rooms.unmuteUsernameByRoomId(data.rid, unmutedUser.username);

		const fromUser = Users.findOneById(fromId);

		Messages.createUserUnmutedWithRoomIdAndUser(data.rid, unmutedUser, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
		});

		return true;
	},
});
