Meteor.publish('livechat:inquiry', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:inquiry' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:inquiry' }));
	}

	const query = {
		agents: this.userId,
		status: 'open'
	};

	return RocketChat.models.LivechatInquiry.find(query);
});
