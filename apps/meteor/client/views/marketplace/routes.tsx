import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerMarketplaceRoute = createRouteGroup(
	'marketplace',
	'/marketplace',
	lazy(() => import('./MarketplaceRouter')),
);

registerMarketplaceRoute('/:context?/:page?/:id?/:version?/:tab?', {
	name: 'marketplace',
	component: lazy(() => import('./AppsRoute')),
});
