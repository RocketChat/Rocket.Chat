import { HTML } from 'meteor/htmljs';

import { createRouteGroup } from '../lib/createRouteGroup';
import { createTemplateForComponent } from '../reactAdapters';

createTemplateForComponent('omnichannelFlex', () => import('./sidebar/OmnichannelSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }), // eslint-disable-line new-cap
});

export const registerOmnichannelRoute = createRouteGroup('omnichannel', '/omnichannel', () => import('./OmnichannelRouter'));

registerOmnichannelRoute('/installation', {
	name: 'omnichannel-installation',
	lazyRouteComponent: () => import('./installation/Installation'),
});
registerOmnichannelRoute('/managers', {
	name: 'omnichannel-managers',
	lazyRouteComponent: () => import('./managers/ManagersRoute'),
});

registerOmnichannelRoute('/agents/:context?/:id?', {
	name: 'omnichannel-agents',
	lazyRouteComponent: () => import('./agents/AgentsRoute'),
});

registerOmnichannelRoute('/webhooks', {
	name: 'omnichannel-webhooks',
	lazyRouteComponent: () => import('./webhooks/WebhooksPage'),
});

registerOmnichannelRoute('/customfields/:context?/:id?', {
	name: 'omnichannel-customfields',
	lazyRouteComponent: () => import('../views/omnichannel/customFields/CustomFieldsRoute'),
});

registerOmnichannelRoute('/appearance', {
	name: 'omnichannel-appearance',
	lazyRouteComponent: () => import('./appearance/AppearancePage'),
});

registerOmnichannelRoute('/businessHours/:context?/:type?/:id?', {
	name: 'omnichannel-businessHours',
	lazyRouteComponent: () => import('./businessHours/BusinessHoursRouter'),
});

registerOmnichannelRoute('/managers', {
	name: 'omnichannel-managers',
	lazyRouteComponent: () => import('./managers/ManagersRoute'),
});

registerOmnichannelRoute('/units/:context?/:id?', {
	name: 'omnichannel-units',
	lazyRouteComponent: () => import('../../../ee/client/omnichannel/units/UnitsRoute'),
});

registerOmnichannelRoute('/tags/:context?/:id?', {
	name: 'omnichannel-tags',
	lazyRouteComponent: () => import('../../../ee/client/omnichannel/tags/TagsRoute'),
});

registerOmnichannelRoute('/priorities/:context?/:id?', {
	name: 'omnichannel-priorities',
	lazyRouteComponent: () => import('../../../ee/client/omnichannel/priorities/PrioritiesRoute'),
});

registerOmnichannelRoute('/triggers/:context?/:id?', {
	name: 'omnichannel-triggers',
	lazyRouteComponent: () => import('./triggers/TriggersPage'),
});

registerOmnichannelRoute('/facebook', {
	name: 'omnichannel-facebook',
	lazyRouteComponent: () => import('./facebook/FacebookPage'),
});

registerOmnichannelRoute('/current', {
	name: 'omnichannel-current-chats',
	lazyRouteComponent: () => import('./currentChats/CurrentChatsRoute'),
});

registerOmnichannelRoute('/departments/:context?/:id?/:tab?', {
	name: 'omnichannel-departments',
	lazyRouteComponent: () => import('./departments/DepartmentsRoute'),
});

registerOmnichannelRoute('/realtime-monitoring', {
	name: 'omnichannel-realTime',
	lazyRouteComponent: () => import('./realTimeMonitoring/RealTimeMonitoringPage'),
});

registerOmnichannelRoute('/analytics', {
	name: 'omnichannel-analytics',
	lazyRouteComponent: () => import('./analytics/AnalyticsPage'),
});
