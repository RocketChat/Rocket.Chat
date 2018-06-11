Meteor.methods({
	getWizardSettings() {
		if (RocketChat.authz.hasRole(Meteor.userId(), 'admin') && RocketChat.models && RocketChat.models.Settings) {
			return RocketChat.models.Settings.findSetupWizardSettings().fetch();
		}

		throw new Meteor.Error('settings-are-not-ready', 'Settings are not ready');
	}
});
