Meteor.methods({
	getWizardSettings(user) {
		if (!user && Meteor.userId()) {
			return false;
		}

		user = Meteor.userId();

		if (RocketChat.authz.hasRole(user, 'admin') && RocketChat.models && RocketChat.models.Settings) {
			return RocketChat.models.Settings.find({wizard: {'$exists': true, '$ne': null}}).fetch();
		}

		throw new Meteor.Error('settings-are-not-ready', 'Settings are not ready');
	}
});
