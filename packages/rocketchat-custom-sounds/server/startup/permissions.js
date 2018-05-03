Meteor.startup(() => {
	if (RocketChat.models && RocketChat.models.Permissions) {
		RocketChat.models.Permissions.createOrUpdate('manage-sounds', ['admin']);
	}
});
