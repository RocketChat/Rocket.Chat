Meteor.publish('livechat:departmentAgents', function(departmentId) {
	if (!this.userId) {
		throw new Meteor.Error('not-authorized');
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
		throw new Meteor.Error('not-authorized');
	}

	return RocketChat.models.LivechatDepartmentAgents.find({ departmentId: departmentId });
});
