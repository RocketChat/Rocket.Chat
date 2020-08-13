import { createTemplateForComponent } from '../reactAdapters';
import { createRouteGroup } from '../helpers/createRouteGroup';

createTemplateForComponent('omnichannelFlex', () => import('./sidebar/OmnichannelSidebar'));

const registerOmnichannelRoute = createRouteGroup('omnichannel', '/omnichannel', () => import('./OmnichannelRouter'));

registerOmnichannelRoute('/installation', {
	name: 'omnichannel-installation',
	lazyRouteComponent: () => import('./installation/Installation'),
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

registerOmnichannelRoute('/managers', {
	name: 'omnichannel-managers',
	lazyRouteComponent: () => import('./ManagersRoute'),
});
