Meteor.publish('livechat:departments', function(_id) {
	if (!this.userId) {
		throw new Meteor.Error('not-authorized');
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
		throw new Meteor.Error('not-authorized');
	}

	if (_id !== undefined) {
		return RocketChat.models.LivechatDepartment.findByDepartmentId(_id);
	} else {
		return RocketChat.models.LivechatDepartment.find();
	}

});
