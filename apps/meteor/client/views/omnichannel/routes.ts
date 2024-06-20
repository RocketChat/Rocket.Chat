import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'omnichannel-index': {
			pattern: '/omnichannel';
			pathname: '/omnichannel';
		};
		'omnichannel-installation': {
			pattern: '/omnichannel/installation';
			pathname: '/omnichannel/installation';
		};
		'omnichannel-managers': {
			pattern: '/omnichannel/managers';
			pathname: '/omnichannel/managers';
		};
		'omnichannel-agents': {
			pattern: '/omnichannel/agents/:context?/:id?';
			pathname: `/omnichannel/agents${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-webhooks': {
			pattern: '/omnichannel/webhooks';
			pathname: '/omnichannel/webhooks';
		};
		'omnichannel-customfields': {
			pattern: '/omnichannel/customfields/:context?/:id?';
			pathname: `/omnichannel/customfields${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-appearance': {
			pattern: '/omnichannel/appearance';
			pathname: '/omnichannel/appearance';
		};
		'omnichannel-businessHours': {
			pattern: '/omnichannel/businessHours/:context?/:type?/:id?';
			pathname: `/omnichannel/businessHours${`/${string}` | ''}${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-units': {
			pattern: '/omnichannel/units/:context?/:id?';
			pathname: `/omnichannel/units${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-tags': {
			pattern: '/omnichannel/tags/:context?/:id?';
			pathname: `/omnichannel/tags${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-queue': {
			pattern: '/omnichannel/queue/:context?/:id?';
			pathname: `/omnichannel/queue${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-rooms': {
			pattern: '/omnichannel/rooms/:context?/:id?';
			pathname: `/omnichannel/rooms${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-triggers': {
			pattern: '/omnichannel/triggers/:context?/:id?';
			pathname: `/omnichannel/triggers${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-current-chats': {
			pattern: '/omnichannel/current/:id?/:tab?/:context?';
			pathname: `/omnichannel/current${`/${string}` | ''}${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-departments': {
			pattern: '/omnichannel/departments/:context?/:id?/:tab?';
			pathname: `/omnichannel/departments${`/${string}` | ''}${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-analytics': {
			pattern: '/omnichannel/analytics';
			pathname: `/omnichannel/analytics`;
		};
		'omnichannel-realTime': {
			pattern: '/omnichannel/realtime-monitoring';
			pathname: `/omnichannel/realtime-monitoring`;
		};
	}
}

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
	component: lazy(() => import('../../omnichannel/units/UnitsRoute')),
});

registerOmnichannelRoute('/tags/:context?/:id?', {
	name: 'omnichannel-tags',
	component: lazy(() => import('../../omnichannel/tags/TagsRoute')),
});

registerOmnichannelRoute('/triggers/:context?/:id?', {
	name: 'omnichannel-triggers',
	component: lazy(() => import('./triggers/TriggersRoute')),
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
