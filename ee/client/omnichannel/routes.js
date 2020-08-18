import { registerOmnichannelRoute } from '../../../client/omnichannel/routes';

registerOmnichannelRoute('/monitors', {
	name: 'omnichannel-monitors',
	lazyRouteComponent: () => import('./MonitorsPage'),
});
