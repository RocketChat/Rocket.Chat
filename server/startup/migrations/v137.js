RocketChat.Migrations.add({
	version: 137,
	up() {
		const firstUser = RocketChat.models.Users.getOldest({ emails: 1 });
		const reportStats = RocketChat.settings.get('Statistics_reporting');

		RocketChat.models.Settings.updateValueById('Organization_Email', firstUser && firstUser.emails && firstUser.emails[0].address);
		RocketChat.models.Settings.updateValueById('Register_Server', reportStats);
	},
});
