import { Meteor } from 'meteor/meteor';
import { lazy } from 'react';

import { registerAdminRoute } from '../../../client/views/admin';
import { onToggledFeature } from '../lib/onToggledFeature';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'engagement-dashboard': {
			pattern: '/admin/engagement/:context?/:tab?';
			pathname: `/admin/engagement${`/${string}` | ''}${`/${string}` | ''}`;
		};
	}
}

const [registerRoute, unregisterRoute] = registerAdminRoute('/engagement/:context?/:tab?', {
	name: 'engagement-dashboard',
	component: lazy(() => import('../views/admin/engagementDashboard/EngagementDashboardRoute')),
	ready: false,
});

onToggledFeature('engagement-dashboard', {
	up: () =>
		Meteor.startup(() => {
			registerRoute();
		}),
	down: () =>
		Meteor.startup(() => {
			unregisterRoute();
		}),
});
