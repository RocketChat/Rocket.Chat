import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerMarketplaceRoute = createRouteGroup(
	'marketplace',
	'/marketplace',
	lazy(() => import('./MarketplaceRouter')),
);

registerMarketplaceRoute('/what-is-it', {
	name: 'marketplace-disabled',
	component: lazy(() => import('./AppsWhatIsIt')),
});

registerMarketplaceRoute('/:context?/:page?/:id?/:version?/:tab?', {
	name: 'marketplace-explore',
	component: lazy(() => import('./AppsRoute')),
});
