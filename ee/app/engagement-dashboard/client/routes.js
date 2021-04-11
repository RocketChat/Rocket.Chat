import { hasAllPermission } from '../../../../app/authorization';
import { registerAdminRoute, registerAdminSidebarItem } from '../../../../client/views/admin';
import { hasLicense } from '../../license/client';
import { createTemplateForComponent } from '../../../../client/lib/portals/createTemplateForComponent';
import { appLayout } from '../../../../client/lib/appLayout';

registerAdminRoute('/engagement-dashboard/:tab?', {
	name: 'engagement-dashboard',
	action: async () => {
		const licensed = await hasLicense('engagement-dashboard');
		if (!licensed) {
			return;
		}

		const EngagementDashboardRoute = createTemplateForComponent('EngagementDashboardRoute', () => import('./components/EngagementDashboardRoute'), { attachment: 'at-parent' });
		appLayout.render('main', { center: EngagementDashboardRoute });
	},
});

hasLicense('engagement-dashboard').then((enabled) => {
	if (!enabled) {
		return;
	}

	registerAdminSidebarItem({
		href: 'engagement-dashboard',
		i18nLabel: 'Engagement Dashboard',
		icon: 'file-keynote',
		permissionGranted: () => hasAllPermission('view-statistics'),
	});
}).catch((error) => {
	console.error('Error checking license.', error);
});
