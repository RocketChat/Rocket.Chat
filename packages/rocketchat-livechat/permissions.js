Meteor.startup(() => {
	var roles = _.pluck(Roles.getAllRoles().fetch(), 'name');
	if (roles.indexOf('livechat-agent') === -1) {
		Roles.createRole('livechat-agent');
	}
	if (roles.indexOf('livechat-manager') === -1) {
		Roles.createRole('livechat-manager');
	}
	if (RocketChat.models && RocketChat.models.Permissions) {
		RocketChat.models.Permissions.createOrUpdate('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
		RocketChat.models.Permissions.createOrUpdate('view-livechat-manager', ['livechat-manager', 'admin']);
	}
});
