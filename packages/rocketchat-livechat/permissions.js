Meteor.startup(() => {
	const roles = _.pluck(RocketChat.models.Roles.find().fetch(), 'name');
	if (roles.indexOf('livechat-agent') === -1) {
		RocketChat.models.Roles.createOrUpdate('livechat-agent');
	}
	if (roles.indexOf('livechat-manager') === -1) {
		RocketChat.models.Roles.createOrUpdate('livechat-manager');
	}
	if (roles.indexOf('livechat-guest') === -1) {
		RocketChat.models.Roles.createOrUpdate('livechat-guest');
	}
	if (RocketChat.models && RocketChat.models.Permissions) {
		RocketChat.models.Permissions.createOrUpdate('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
		RocketChat.models.Permissions.createOrUpdate('view-livechat-manager', ['livechat-manager', 'admin']);
		RocketChat.models.Permissions.createOrUpdate('view-livechat-rooms', ['livechat-manager', 'admin']);
		RocketChat.models.Permissions.createOrUpdate('close-livechat-room', ['livechat-agent', 'livechat-manager', 'admin']);
		RocketChat.models.Permissions.createOrUpdate('close-others-livechat-room', ['livechat-manager', 'admin']);
		RocketChat.models.Permissions.createOrUpdate('save-others-livechat-room-info', ['livechat-manager']);
	}
});
