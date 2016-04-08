Meteor.publish('livechat:visitorCustomField', function(roomId) {
	if (!this.userId) {
		throw new Meteor.Error('not-authorized');
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
		throw new Meteor.Error('not-authorized');
	}

	var room = RocketChat.models.Rooms.findOneById(roomId);

	if (room && room.v && room.v.token) {
		return RocketChat.models.LivechatCustomField.findByToken(room.v.token);
	} else {
		return this.ready();
	}
});
