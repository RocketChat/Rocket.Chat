import { registerOmnichannelRoute } from '../../../client/omnichannel/routes';

registerOmnichannelRoute('/monitors', {
	name: 'omnichannel-monitors',
	lazyRouteComponent: () => import('./MonitorsPage'),
});

registerOmnichannelRoute('/priorities/:context?/:id?', {
	name: 'omnichannel-priorities',
	lazyRouteComponent: () => import('./priorities/PrioritiesRoute'),
});
