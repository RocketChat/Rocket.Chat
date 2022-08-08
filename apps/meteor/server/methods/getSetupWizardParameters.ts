import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../app/settings/server';

Meteor.methods({
	async getSetupWizardParameters() {
		const setupWizardSettings = await Settings.findSetupWizardSettings().toArray();
		const serverAlreadyRegistered = !!settings.get('Cloud_Workspace_Client_Id') || process.env.DEPLOY_PLATFORM === 'rocket-cloud';

		return {
			settings: setupWizardSettings,
			serverAlreadyRegistered,
		};
	},
});
