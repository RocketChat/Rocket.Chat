import { registerOmnichannelRoute } from '../../../client/omnichannel/routes';

registerOmnichannelRoute('/priorities', {
	name: 'omnichannel-priorities',
	lazyRouteComponent: () => import('./priorities/PrioritiesRoute'),
});
