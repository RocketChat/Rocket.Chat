Meteor.publish('livechat:rooms', function(offset = 0, limit = 20) {
	if (!this.userId) {
		throw new Meteor.Error('not-authorized');
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
		throw new Meteor.Error('not-authorized');
	}

	return RocketChat.models.Rooms.findLivechat(offset, limit);
});
