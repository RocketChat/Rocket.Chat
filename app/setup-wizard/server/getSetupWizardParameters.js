import { Meteor } from 'meteor/meteor';
import { hasRole } from '../../authorization';
import { Settings } from '../../models';

Meteor.methods({
	getSetupWizardParameters() {
		const userId = Meteor.userId();
		const userHasAdminRole = userId && hasRole(userId, 'admin');

		if (!userHasAdminRole) {
			throw new Meteor.Error('error-not-allowed');
		}

		const settings = Settings.findSetupWizardSettings().fetch();
		const allowStandaloneServer = process.env.DEPLOY_PLATFORM !== 'rocket-cloud';

		return {
			settings,
			allowStandaloneServer,
		};
	},
});
