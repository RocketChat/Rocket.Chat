import { createRouteGroup } from '../helpers/createRouteGroup';

const registerOmnichannelRoute = createRouteGroup('omnichannel', '/omnichannel', () => import('./OmnichannelRouter'));

registerOmnichannelRoute('/installation', {
	name: 'omnichannel-installation',
	lazyRouteComponent: () => import('./installation/Installation'),
});

registerOmnichannelRoute('/customfields/:context?/:id?', {
	name: 'omnichannel-customfields',
	lazyRouteComponent: () => import('./customFields/CustomFieldsRouter'),
});
