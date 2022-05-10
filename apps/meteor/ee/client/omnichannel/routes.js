import { registerOmnichannelRoute } from '../../../client/views/omnichannel/routes';

registerOmnichannelRoute('/monitors', {
	name: 'omnichannel-monitors',
	lazyRouteComponent: () => import('./monitors/MonitorsPageContainer'),
});

registerOmnichannelRoute('/priorities/:context?/:id?', {
	name: 'omnichannel-priorities',
	lazyRouteComponent: () => import('./priorities/PrioritiesRoute'),
});

registerOmnichannelRoute('/canned-responses/:context?/:id?', {
	name: 'omnichannel-canned-responses',
	lazyRouteComponent: () => import('./cannedResponses/CannedResponsesRoute'),
});
