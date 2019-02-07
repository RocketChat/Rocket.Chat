import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	getSetupWizardParameters() {
		const userId = Meteor.userId();
		const userHasAdminRole = userId && RocketChat.authz.hasRole(userId, 'admin');

		if (!userHasAdminRole) {
			throw new Meteor.Error('error-not-allowed');
		}

		const settings = RocketChat.models.Settings.findSetupWizardSettings().fetch();
		const allowStandaloneServer = process.env.DEPLOY_PLATFORM !== 'rocket-cloud';

		return {
			settings,
			allowStandaloneServer,
		};
	},
});
