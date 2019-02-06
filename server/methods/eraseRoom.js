import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { roomTypes } from 'meteor/rocketchat:utils';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Rooms, Messages, Subscriptions } from 'meteor/rocketchat:models';

Meteor.methods({
	eraseRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'eraseRoom',
			});
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'eraseRoom',
			});
		}

		if (Apps && Apps.isLoaded()) {
			const prevent = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomDeletePrevent', room));
			if (prevent) {
				throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the room erasing.');
			}
		}

		if (!roomTypes.roomTypes[room.t].canBeDeleted(hasPermission, room)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'eraseRoom',
			});
		}

		Messages.removeFilesByRoomId(rid);
		Messages.removeByRoomId(rid);
		Subscriptions.removeByRoomId(rid);
		const result = Rooms.removeById(rid);

		if (Apps && Apps.isLoaded()) {
			Apps.getBridges().getListenerBridge().roomEvent('IPostRoomDeleted', room);
		}

		return result;
	},
});
