import { FlowRouter } from 'meteor/kadira:flow-router';

import { hasAllPermission } from '../../../../app/authorization';
import { AdminBox } from '../../../../app/ui-utils';
import { renderRouteComponent } from '../../../../client/reactAdapters';
import { hasLicense } from '../../license/client';

FlowRouter.route('/admin/engagement-dashboard/:tab?', {
	name: 'engagement-dashboard',
	action: async () => {
		const licensed = await hasLicense('engagement-dashboard');
		if (!licensed) {
			return;
		}

		renderRouteComponent(() => import('./components/EngagementDashboardRoute'), { template: 'main', region: 'center' });
	},
});

hasLicense('engagement-dashboard').then((enabled) => {
	if (!enabled) {
		return;
	}

	AdminBox.addOption({
		href: 'engagement-dashboard',
		i18nLabel: 'Engagement Dashboard',
		icon: 'file-keynote',
		permissionGranted: () => hasAllPermission('view-statistics'),
	});
}).catch((error) => {
	console.error('Error checking license.', error);
});
