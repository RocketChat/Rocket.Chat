import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerAccountRoute = createRouteGroup('account', '/account', (): any => import('./AccountRouter'));

registerAccountRoute('/preferences', {
	name: 'preferences',
	lazyRouteComponent: () => import('./preferences/AccountPreferencesPage'),
});

registerAccountRoute('/profile', {
	name: 'profile',
	lazyRouteComponent: () => import('./profile/AccountProfileRoute'),
});

registerAccountRoute('/security', {
	name: 'security',
	lazyRouteComponent: () => import('./security/AccountSecurityRoute'),
});

registerAccountRoute('/integrations', {
	name: 'integrations',
	lazyRouteComponent: () => import('./integrations/AccountIntegrationsRoute'),
});

registerAccountRoute('/tokens', {
	name: 'tokens',
	lazyRouteComponent: () => import('./tokens/AccountTokensRoute'),
});
