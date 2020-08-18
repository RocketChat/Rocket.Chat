import { registerOmnichannelRoute } from '../../../client/omnichannel/routes';

registerOmnichannelRoute('/monitors2', {
	name: 'omnichannel-monitors',
	lazyRouteComponent: () => import('./MonitorsPage'),
});
