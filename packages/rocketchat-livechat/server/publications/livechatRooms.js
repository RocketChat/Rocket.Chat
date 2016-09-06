Meteor.publish('livechat:rooms', function(offset = 0, limit = 20) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:rooms' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:rooms' }));
	}

	return RocketChat.models.Rooms.findLivechat(offset, limit);
});
