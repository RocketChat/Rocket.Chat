import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerOmnichannelRoute = createRouteGroup(
	'omnichannel',
	'/omnichannel',
	lazy(() => import('./OmnichannelRouter')),
);

registerOmnichannelRoute('/installation', {
	name: 'omnichannel-installation',
	component: lazy(() => import('./installation/Installation')),
});

registerOmnichannelRoute('/managers', {
	name: 'omnichannel-managers',
	component: lazy(() => import('./managers/ManagersRoute')),
});

registerOmnichannelRoute('/agents/:context?/:id?', {
	name: 'omnichannel-agents',
	component: lazy(() => import('./agents/AgentsPage')),
});

registerOmnichannelRoute('/webhooks', {
	name: 'omnichannel-webhooks',
	component: lazy(() => import('./webhooks/WebhooksPageContainer')),
});

registerOmnichannelRoute('/customfields/:context?/:id?', {
	name: 'omnichannel-customfields',
	component: lazy(() => import('./customFields/CustomFieldsRoute')),
});

registerOmnichannelRoute('/appearance', {
	name: 'omnichannel-appearance',
	component: lazy(() => import('./appearance/AppearancePageContainer')),
});

registerOmnichannelRoute('/businessHours/:context?/:type?/:id?', {
	name: 'omnichannel-businessHours',
	component: lazy(() => import('./businessHours/BusinessHoursRouter')),
});

registerOmnichannelRoute('/units/:context?/:id?', {
	name: 'omnichannel-units',
	component: lazy(() => import('../../../ee/client/omnichannel/units/UnitsRoute')),
});

registerOmnichannelRoute('/tags/:context?/:id?', {
	name: 'omnichannel-tags',
	component: lazy(() => import('../../../ee/client/omnichannel/tags/TagsRoute')),
});

registerOmnichannelRoute('/priorities/:context?/:id?', {
	name: 'omnichannel-priorities',
	component: lazy(() => import('../../../ee/client/omnichannel/priorities/PrioritiesRoute')),
});

registerOmnichannelRoute('/triggers/:context?/:id?', {
	name: 'omnichannel-triggers',
	component: lazy(() => import('./triggers/TriggersPage')),
});

registerOmnichannelRoute('/facebook', {
	name: 'omnichannel-facebook',
	component: lazy(() => import('./facebook/FacebookPageContainer')),
});

registerOmnichannelRoute('/current/:id?/:tab?/:context?', {
	name: 'omnichannel-current-chats',
	component: lazy(() => import('./currentChats/CurrentChatsRoute')),
});

registerOmnichannelRoute('/departments/:context?/:id?/:tab?', {
	name: 'omnichannel-departments',
	component: lazy(() => import('./departments/DepartmentsRoute')),
});

registerOmnichannelRoute('/realtime-monitoring', {
	name: 'omnichannel-realTime',
	component: lazy(() => import('./realTimeMonitoring/RealTimeMonitoringPage')),
});

registerOmnichannelRoute('/analytics', {
	name: 'omnichannel-analytics',
	component: lazy(() => import('./analytics/AnalyticsPage')),
});
