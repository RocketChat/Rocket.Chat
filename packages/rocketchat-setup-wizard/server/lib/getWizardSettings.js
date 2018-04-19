Meteor.methods({
	getWizardSettings(step) {
		if (RocketChat.models && RocketChat.models.Settings) {
			return RocketChat.models.Settings.find({wizard: {'$exists': true, '$ne': null}}).fetch();
		}

		throw new Meteor.Error('invalid-settings', 'Invalid settings');
	}
});
