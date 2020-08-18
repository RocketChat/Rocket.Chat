import { createTemplateForComponent } from '../reactAdapters';
import { createRouteGroup } from '../helpers/createRouteGroup';

createTemplateForComponent('omnichannelFlex', () => import('./sidebar/OmnichannelSidebar'));

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
	lazyRouteComponent: () => import('./customFields/CustomFieldsRouter'),
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
