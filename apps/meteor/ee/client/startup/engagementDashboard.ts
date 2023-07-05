import { Meteor } from 'meteor/meteor';
import { lazy } from 'react';

import { hasAllPermission } from '../../../app/authorization/client';
import { registerAdminRoute, registerAdminSidebarItem, unregisterAdminSidebarItem } from '../../../client/views/admin';
import { onToggledFeature } from '../lib/onToggledFeature';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'engagement-dashboard': {
			pattern: '/admin/engagement/:tab?';
			pathname: `/admin/engagement${`/${string}` | ''}`;
		};
	}
}

const [registerRoute, unregisterRoute] = registerAdminRoute('/engagement/:tab?', {
	name: 'engagement-dashboard',
	component: lazy(() => import('../views/admin/engagementDashboard/EngagementDashboardRoute')),
	ready: false,
});

onToggledFeature('engagement-dashboard', {
	up: () =>
		Meteor.startup(() => {
			registerAdminSidebarItem({
				href: '/admin/engagement',
				i18nLabel: 'Engagement',
				icon: 'dashboard',
				permissionGranted: () => hasAllPermission('view-engagement-dashboard'),
			});
			registerRoute();
		}),
	down: () =>
		Meteor.startup(() => {
			unregisterAdminSidebarItem('Engagement');
			unregisterRoute();
		}),
});
