Meteor.publish('livechat:departments', function(_id) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	if (_id !== undefined) {
		return RocketChat.models.LivechatDepartment.findByDepartmentId(_id);
	} else {
		return RocketChat.models.LivechatDepartment.find();
	}

});
