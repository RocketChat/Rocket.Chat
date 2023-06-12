import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface RouterPaths {
		'/account': '/account';
		'/account/preferences': '/account/preferences';
		'/account/profile': '/account/profile';
		'/account/security': '/account/security';
		'/account/integrations': '/account/integrations';
		'/account/tokens': '/account/tokens';
		'/account/omnichannel': '/account/omnichannel';
	}
}

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

registerAccountRoute('/omnichannel', {
	name: 'omnichannel',
	component: lazy(() => import('./omnichannel/OmnichannelPreferencesPage')),
});
