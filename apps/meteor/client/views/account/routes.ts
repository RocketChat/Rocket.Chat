import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerAccountRoute = createRouteGroup('account', '/account', () => import('./AccountRouter'));

registerAccountRoute('/preferences', {
	name: 'preferences',
	lazyRouteComponent: () => import('./preferences/AccountPreferencesPage'),
});

registerAccountRoute('/profile', {
	name: 'profile',
	lazyRouteComponent: () => import('./AccountProfilePage'),
});

registerAccountRoute('/security', {
	name: 'security',
	lazyRouteComponent: () => import('./security/AccountSecurityPage'),
});

registerAccountRoute('/integrations', {
	name: 'integrations',
	lazyRouteComponent: () => import('./AccountIntegrationsPage'),
});

registerAccountRoute('/tokens', {
	name: 'tokens',
	lazyRouteComponent: () => import('./tokens/AccountTokensPage'),
});
