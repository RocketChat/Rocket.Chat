import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerMarketplaceRoute = createRouteGroup(
	'markeptlace',
	'/marketplace',
	lazy(() => import('./MarketplaceRouter')),
);

registerMarketplaceRoute('/what-is-it', {
	name: 'marketplace-disabled',
	component: lazy(() => import('./AppsWhatIsIt')),
});

registerMarketplaceRoute('/all/:context?/:page?/:id?/:version?/:tab?', {
	name: 'marketplace-all',
	component: lazy(() => import('./AppsRoute')),
	triggersEnter: [
		(context, redirect): void => {
			if (!context.params.context) {
				redirect('/marketplace/all/list');
			}
		},
	],
});
