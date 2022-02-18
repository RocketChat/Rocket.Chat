import { Meteor } from 'meteor/meteor';

import { Settings } from '../../app/models';
import { settings } from '../../app/settings/server';

Meteor.methods({
	getSetupWizardParameters() {
		const setupWizardSettings = Settings.findSetupWizardSettings().fetch();
		const serverAlreadyRegistered = !!settings.get('Cloud_Workspace_Client_Id') || process.env.DEPLOY_PLATFORM === 'rocket-cloud';

		return {
			settings: setupWizardSettings,
			serverAlreadyRegistered,
		};
	},
});
