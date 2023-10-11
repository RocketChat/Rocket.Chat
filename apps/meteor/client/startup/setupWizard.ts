import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasPermission, hasRole } from '../../app/authorization/client';
import { settings } from '../../app/settings/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { router } from '../providers/RouterProvider';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const userId = Meteor.userId();
		const setupWizardState = settings.get('Show_Setup_Wizard');

		const isAdmin = userId && hasRole(userId, 'admin');

		const isWizardInProgress = isAdmin && setupWizardState === 'in_progress';
		const { registrationStatus } = await sdk.rest.get('/v1/cloud.registrationStatus');

		const hasRegisterCloudPermission = hasPermission('register-on-cloud');
		const isWorkspaceRegistered = registrationStatus?.workspaceRegistered;

		const mustRedirect =
			(!userId && setupWizardState === 'pending') || isWizardInProgress || (!isWorkspaceRegistered && hasRegisterCloudPermission);

		if (mustRedirect) {
			router.navigate('/setup-wizard');
		}
	});
});
