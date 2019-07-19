import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatRooms, Messages } from '../../../models';

Meteor.publish('livechat:visitorPageVisited', function({ rid: roomId, token }) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorPageVisited' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorPageVisited' }));
	}

	const self = this;
	const room = LivechatRooms.findOneById(roomId);

	if (room && token === '') {
		const handle = Messages.findByRoomIdAndType(room._id, 'livechat_navigation_history').observeChanges({
			added(id, fields) {
				self.added('visitor_navigation_history', id, fields);
			},
			changed(id, fields) {
				self.changed('visitor_navigation_history', id, fields);
			},
			removed(id) {
				self.removed('visitor_navigation_history', id);
			},
		});

		self.ready();

		self.onStop(function() {
			handle.stop();
		});
	} else if (roomId === '' && token !== '') {
		const handle = Messages.findByTokenAndType(token, 'livechat_navigation_history').observeChanges({
			added(id, fields) {
				self.added('visitor_navigation_history', id, fields);
			},
			changed(id, fields) {
				self.changed('visitor_navigation_history', id, fields);
			},
			removed(id) {
				self.removed('visitor_navigation_history', id);
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
