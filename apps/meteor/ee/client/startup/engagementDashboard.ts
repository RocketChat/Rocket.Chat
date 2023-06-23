import { Meteor } from 'meteor/meteor';
import { lazy } from 'react';

import { registerAdminRoute } from '../../../client/views/admin';
import { onToggledFeature } from '../lib/onToggledFeature';

const [registerRoute, unregisterRoute] = registerAdminRoute('/engagement-dashboard/:context?/:tab?', {
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
