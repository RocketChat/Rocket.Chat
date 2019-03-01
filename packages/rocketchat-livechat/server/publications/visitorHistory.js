import { Meteor } from 'meteor/meteor';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Rooms, Subscriptions } from 'meteor/rocketchat:models';

Meteor.publish('livechat:visitorHistory', function({ rid: roomId }) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorHistory' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorHistory' }));
	}

	const room = Rooms.findOneById(roomId);

	const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } });
	if (!subscription) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorHistory' }));
	}

	const self = this;

	if (room && room.v && room.v._id) {
		const handle = Rooms.findByVisitorId(room.v._id).observeChanges({
			added(id, fields) {
				self.added('visitor_history', id, fields);
			},
			changed(id, fields) {
				self.changed('visitor_history', id, fields);
			},
			removed(id) {
				self.removed('visitor_history', id);
			},
		});

		self.ready();

		self.onStop(function() {
			handle.stop();
		});
	} else {
		self.ready();
	}
});
