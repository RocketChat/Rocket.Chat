import { Meteor } from 'meteor/meteor';

import { Settings } from '../../app/models';

Meteor.methods({
	getSetupWizardParameters() {
		const settings = Settings.findSetupWizardSettings().fetch();
		const allowStandaloneServer = process.env.DEPLOY_PLATFORM !== 'rocket-cloud';

		return {
			settings,
			allowStandaloneServer,
		};
	},
});
