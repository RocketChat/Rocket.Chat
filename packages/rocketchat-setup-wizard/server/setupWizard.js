Meteor.methods({
	getSetupWizardParameters() {
		const userHasAdminRole = Meteor.userId() && RocketChat.authz.hasRole(Meteor.userId(), 'admin');
		const isSettingsModelReady = RocketChat.models && RocketChat.models.Settings;
		if (!userHasAdminRole || !isSettingsModelReady) {
			throw new Meteor.Error('settings-are-not-ready', 'Settings are not ready');
		}

		const settings = RocketChat.models.Settings.findSetupWizardSettings().fetch();
		const allowStandaloneServer = process.env.DEPLOY_PLATFORM !== 'rocket-cloud';

		return {
			settings,
			allowStandaloneServer
		};
	}
});
