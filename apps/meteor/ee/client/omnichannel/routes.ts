import { lazy } from 'react';

import { registerOmnichannelRoute } from '../../../client/views/omnichannel/routes';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'omnichannel-monitors': {
			pattern: '/omnichannel/monitors';
			pathname: '/omnichannel/monitors';
		};
		'omnichannel-sla-policies': {
			pattern: '/omnichannel/sla-policies/:context?/:id?';
			pathname: `/omnichannel/sla-policies${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-priorities': {
			pattern: '/omnichannel/priorities/:context?/:id?';
			pathname: `/omnichannel/priorities${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-canned-responses': {
			pattern: '/omnichannel/canned-responses/:context?/:id?';
			pathname: `/omnichannel/canned-responses${`/${string}` | ''}${`/${string}` | ''}`;
		};
		'omnichannel-reports': {
			pattern: '/omnichannel/reports';
			pathname: `/omnichannel/reports`;
		};
	}
}

registerOmnichannelRoute('/monitors', {
	name: 'omnichannel-monitors',
	component: lazy(() => import('./monitors/MonitorsPageContainer')),
});

registerOmnichannelRoute('/sla-policies/:context?/:id?', {
	name: 'omnichannel-sla-policies',
	component: lazy(() => import('./slaPolicies/SlaRoute')),
});

registerOmnichannelRoute('/priorities/:context?/:id?', {
	name: 'omnichannel-priorities',
	component: lazy(() => import('./priorities/PrioritiesRoute')),
});

registerOmnichannelRoute('/canned-responses/:context?/:id?', {
	name: 'omnichannel-canned-responses',
	component: lazy(() => import('./cannedResponses/CannedResponsesRoute')),
});

registerOmnichannelRoute('/reports', {
	name: 'omnichannel-reports',
	component: lazy(() => import('./reports/ReportsPage')),
});
