import { lazy } from 'react';

import { registerOmnichannelRoute } from '../../../client/views/omnichannel/routes';

registerOmnichannelRoute('/monitors', {
	name: 'omnichannel-monitors',
	component: lazy(() => import('./monitors/MonitorsPageContainer')),
});

registerOmnichannelRoute('/sla-policies/:context?/:id?', {
	name: 'omnichannel-sla-policies',
	component: lazy(() => import('./slaPolicies/SlasRoute')),
});

registerOmnichannelRoute('/priorities/:context?/:id?', {
	name: 'omnichannel-priorities',
	component: lazy(() => import('./priorities/PrioritiesRoute')),
});

registerOmnichannelRoute('/canned-responses/:context?/:id?', {
	name: 'omnichannel-canned-responses',
	component: lazy(() => import('./cannedResponses/CannedResponsesRoute')),
});
