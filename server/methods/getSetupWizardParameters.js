import { Meteor } from 'meteor/meteor';

import { Settings } from '../../app/models';
import { Users } from '../../app/models/server';
import { settings } from '../../app/settings/server';

Meteor.methods({
	getSetupWizardParameters() {
		const setupWizardSettings = Settings.findSetupWizardSettings().fetch();
		const serverAlreadyRegistered = !!settings.get('Cloud_Workspace_Client_Id') || process.env.DEPLOY_PLATFORM === 'rocket-cloud';
		const hasAdmin = Boolean(
			Users.findOne(
				{
					roles: 'admin',
					type: 'user',
				},
				{
					fields: {
						_id: 1,
					},
				},
			),
		);

		return {
			settings: setupWizardSettings,
			serverAlreadyRegistered,
			hasAdmin,
		};
	},
});
