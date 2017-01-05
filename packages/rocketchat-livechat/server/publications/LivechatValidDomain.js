Meteor.publish('livechat:validDomain', function() {
	if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	return RocketChat.models.LivechatValidDomains.find();
});