import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerMarketplaceRoute = createRouteGroup(
	'marketplace',
	'/marketplace',
	lazy(() => import('./MarketplaceRouter')),
);

registerMarketplaceRoute('/what-is-it', {
	name: 'admin-apps-disabled',
	component: lazy(() => import('./AppsWhatIsIt')),
});

registerMarketplaceRoute('/:context?/:id?/:version?/:tab?', {
	name: 'admin-marketplace',
	component: lazy(() => import('./AppsRoute')),
});
