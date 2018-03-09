Meteor.publish('livechat:visitorPageVisited', function({ rid: roomId }) {

	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorPageVisited' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorPageVisited' }));
	}

	const room = RocketChat.models.Rooms.findOneById(roomId);

	if (room) {
		return RocketChat.models.Messages.findByRoomIdAndType(room._id, 'livechat_navigation_history');
	} else {
		return this.ready();
	}
});
