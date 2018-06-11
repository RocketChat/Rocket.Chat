Meteor.publish('livechat:visitorPageVisited', function({ rid: roomId }) {

	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorPageVisited' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorPageVisited' }));
	}

	const self = this;
	const room = RocketChat.models.Rooms.findOneById(roomId);

	if (room) {
		const handle = RocketChat.models.Messages.findByRoomIdAndType(room._id, 'livechat_navigation_history').observeChanges({
			added(id, fields) {
				self.added('visitor_navigation_history', id, fields);
			},
			changed(id, fields) {
				self.changed('visitor_navigation_history', id, fields);
			},
			removed(id) {
				self.removed('visitor_navigation_history', id);
			}
		});

		self.ready();

		self.onStop(function() {
			handle.stop();
		});
	} else {
		self.ready();
	}
});
