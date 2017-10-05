Meteor.startup(() => {
	if (RocketChat.models && RocketChat.models.Permissions) {
		if (!RocketChat.models.Permissions.findOne({ _id: 'auto-translate' })) {
			RocketChat.models.Permissions.insert({ _id: 'auto-translate', roles: ['admin'] });
		}
	}
});
