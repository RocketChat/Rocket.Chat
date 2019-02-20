import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Rooms } from 'meteor/rocketchat:models';
import { Apps } from 'meteor/rocketchat:apps';

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

		if (!RocketChat.roomTypes.roomTypes[room.t].canBeDeleted(hasPermission, room)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'eraseRoom',
			});
		}

		if (Apps && Apps.isLoaded()) {
			const prevent = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomDeletePrevent', room));
			if (prevent) {
				throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the room erasing.');
			}
		}

		const result = RocketChat.deleteRoom(rid);

		if (Apps && Apps.isLoaded()) {
			Apps.getBridges().getListenerBridge().roomEvent('IPostRoomDeleted', room);
		}

		return result;
	},
});
