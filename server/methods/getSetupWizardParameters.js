import { Meteor } from 'meteor/meteor';

import { Settings } from '../../app/models';

Meteor.methods({
	getSetupWizardParameters() {
		const settings = Settings.findSetupWizardSettings().fetch();
		const [registerServerSetting] = Settings.findById('Register_Server').fetch();
		const canSkipRegistration = registerServerSetting.value || process.env.DEPLOY_PLATFORM === 'rocket-cloud';

		return {
			settings,
			canSkipRegistration,
		};
	},
});
