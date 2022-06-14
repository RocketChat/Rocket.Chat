import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerAccountRoute = createRouteGroup(
	'account',
	'/account',
	lazy(() => import('./AccountRouter')),
);

registerAccountRoute('/preferences', {
	name: 'preferences',
	component: lazy(() => import('./preferences/AccountPreferencesPage')),
});

registerAccountRoute('/profile', {
	name: 'profile',
	component: lazy(() => import('./profile/AccountProfileRoute')),
});

registerAccountRoute('/security', {
	name: 'security',
	component: lazy(() => import('./security/AccountSecurityRoute')),
});

registerAccountRoute('/integrations', {
	name: 'integrations',
	component: lazy(() => import('./integrations/AccountIntegrationsRoute')),
});

registerAccountRoute('/tokens', {
	name: 'tokens',
	component: lazy(() => import('./tokens/AccountTokensRoute')),
});
