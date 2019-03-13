import { Meteor } from 'meteor/meteor';
import { hasPermission } from '/app/authorization';
import { Rooms, Messages, Subscriptions } from '/app/models';

Meteor.methods({
	'livechat:removeRoom'(rid) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'remove-closed-livechat-rooms')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeRoom' });
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:removeRoom',
			});
		}

		if (room.t !== 'l') {
			throw new Meteor.Error('error-this-is-not-a-livechat-room', 'This is not a Livechat room', {
				method: 'livechat:removeRoom',
			});
		}

		if (room.open) {
			throw new Meteor.Error('error-room-is-not-closed', 'Room is not closed', {
				method: 'livechat:removeRoom',
			});
		}

		Messages.removeByRoomId(rid);
		Subscriptions.removeByRoomId(rid);
		return Rooms.removeById(rid);
	},
});
