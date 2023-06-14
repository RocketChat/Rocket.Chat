import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface RouterPaths {
		'marketplace-index': {
			pattern: '/marketplace';
			pathname: '/marketplace';
		};
		'marketplace': {
			pattern: '/marketplace/:context?/:page?/:id?/:version?/:tab?';
			pathname: `/marketplace${`/${string}` | ''}${`/${string}` | ''}${`/${string}` | ''}${`/${string}` | ''}${`/${string}` | ''}`;
		};
	}
}

export const registerMarketplaceRoute = createRouteGroup(
	'marketplace',
	'/marketplace',
	lazy(() => import('./MarketplaceRouter')),
);

registerMarketplaceRoute('/:context?/:page?/:id?/:version?/:tab?', {
	name: 'marketplace',
	component: lazy(() => import('./AppsRoute')),
});
