Meteor.publish('livechat:triggers', function(_id) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:triggers' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:triggers' }));
	}

	if (_id !== undefined) {
		return RocketChat.models.LivechatTrigger.findById(_id);
	} else {
		return RocketChat.models.LivechatTrigger.find();
	}
});
