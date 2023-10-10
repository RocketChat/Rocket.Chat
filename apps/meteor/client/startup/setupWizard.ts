import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasRole } from '../../app/authorization/client';
import { settings } from '../../app/settings/client';
import { router } from '../providers/RouterProvider';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const userId = Meteor.userId();
		const setupWizardState = settings.get('Show_Setup_Wizard');

		const isAdmin = userId && hasRole(userId, 'admin');

		const isWizardInProgress = isAdmin && setupWizardState === 'in_progress';
		const isWorkspaceRegistered = isAdmin && !!settings.get('Cloud_Workspace_Client_Id') && !!settings.get('Cloud_Workspace_Client_Secret');

		const mustRedirect = (!userId && setupWizardState === 'pending') || isWizardInProgress || !isWorkspaceRegistered;

		if (mustRedirect) {
			router.navigate('/setup-wizard');
		}
	});
});
