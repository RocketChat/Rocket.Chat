Meteor.publish('livechat:availableDepartments', function() {
	return RocketChat.models.LivechatDepartment.findEnabledWithAgents();
});
