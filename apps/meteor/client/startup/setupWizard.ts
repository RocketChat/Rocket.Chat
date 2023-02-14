import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasRole } from '../../app/authorization/client';
import { settings } from '../../app/settings/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const userId = Meteor.userId();
		const setupWizardState = settings.get('Show_Setup_Wizard');

		const isWizardInProgress = userId && hasRole(userId, 'admin') && setupWizardState === 'in_progress';
		const mustRedirect = (!userId && setupWizardState === 'pending') || isWizardInProgress;

		if (mustRedirect) {
			FlowRouter.go('setup-wizard');
		}
	});
});
