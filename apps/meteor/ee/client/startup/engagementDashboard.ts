import { Meteor } from 'meteor/meteor';
import { lazy } from 'react';

import { hasAllPermission } from '../../../app/authorization/client';
import { registerAdminRoute, registerAdminSidebarItem, unregisterAdminSidebarItem } from '../../../client/views/admin';
import { onToggledFeature } from '../lib/onToggledFeature';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface RouterPaths {
		'engagement-dashboard': {
			pattern: '/admin/engagement-dashboard/:tab?';
			pathname: `/admin/engagement-dashboard${`/${string}` | ''}`;
		};
	}
}

const [registerRoute, unregisterRoute] = registerAdminRoute('/engagement-dashboard/:tab?', {
	name: 'engagement-dashboard',
	component: lazy(() => import('../views/admin/engagementDashboard/EngagementDashboardRoute')),
	ready: false,
});

onToggledFeature('engagement-dashboard', {
	up: () =>
		Meteor.startup(() => {
			registerAdminSidebarItem({
				href: '/admin/engagement-dashboard',
				i18nLabel: 'Engagement Dashboard',
				icon: 'file-keynote',
				permissionGranted: () => hasAllPermission('view-engagement-dashboard'),
			});
			registerRoute();
		}),
	down: () =>
		Meteor.startup(() => {
			unregisterAdminSidebarItem('Engagement Dashboard');
			unregisterRoute();
		}),
});
