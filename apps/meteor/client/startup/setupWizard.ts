import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasRole } from '../../app/authorization/client';
import { settings } from '../../app/settings/client';
// import { sdk } from '../../app/utils/client/lib/SDKClient';
import { router } from '../providers/RouterProvider';

Meteor.startup(
	/* async*/ () => {
		// const { registrationStatus } = await sdk.rest.get('/v1/cloud.registrationStatus');

		Tracker.autorun(() => {
			const setupWizardState = settings.get('Show_Setup_Wizard');

			// const hasRegisterCloudPermission = hasPermission('register-on-cloud');
			const userId = Meteor.userId();

			const isAdmin = userId && hasRole(userId, 'admin');

			const isWizardInProgress = isAdmin && setupWizardState === 'in_progress';

			// const isWorkspaceRegistered = registrationStatus?.workspaceRegistered;

			const mustRedirect =
				(!userId && setupWizardState === 'pending') || isWizardInProgress; /* || (!isWorkspaceRegistered && hasRegisterCloudPermission)*/

			if (mustRedirect) {
				router.navigate('/setup-wizard');
			}
		});
	},
);
