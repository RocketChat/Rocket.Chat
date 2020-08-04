import { createRouteGroup } from '../helpers/createRouteGroup';

const registerOmnichannelRoute = createRouteGroup('omnichannel', '/omnichannel', () => import('./OmnichannelRouter'));

registerOmnichannelRoute('/installation', {
	name: 'omnichannel-installation',
	lazyRouteComponent: () => import('./installation/Installation'),
});
registerOmnichannelRoute('/managers', {
	name: 'omnichannel-managers',
	lazyRouteComponent: () => import('./managers/ManagersRoute'),
});
