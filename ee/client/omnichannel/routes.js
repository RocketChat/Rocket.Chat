import { registerOmnichannelRoute } from '../../../client/views/omnichannel/routes';

registerOmnichannelRoute('/monitors', {
	name: 'omnichannel-monitors',
	lazyRouteComponent: () => import('./monitors/MonitorsPage'),
});

registerOmnichannelRoute('/priorities/:context?/:id?', {
	name: 'omnichannel-priorities',
	lazyRouteComponent: () => import('./priorities/PrioritiesRoute'),
});
