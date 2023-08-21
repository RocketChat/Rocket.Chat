import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'account-index': {
			pathname: '/account';
			pattern: '/account';
		};
		'preferences': {
			pathname: '/account/preferences';
			pattern: '/account/preferences';
		};
		'profile': {
			pathname: '/account/profile';
			pattern: '/account/profile';
		};
		'security': {
			pathname: '/account/security';
			pattern: '/account/security';
		};
		'integrations': {
			pathname: '/account/integrations';
			pattern: '/account/integrations';
		};
		'tokens': {
			pathname: '/account/tokens';
			pattern: '/account/tokens';
		};
		'omnichannel': {
			pathname: '/account/omnichannel';
			pattern: '/account/omnichannel';
		};
		'feature-preview': {
			pathname: '/account/feature-preview';
			pattern: '/account/feature-preview';
		};
		'theme': {
			pathname: '/account/theme';
			pattern: '/account/theme';
		};
		'accessibility': {
			pathname: '/account/accessibility';
			pattern: '/account/accessibility';
		};
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

registerAccountRoute('/feature-preview', {
	name: 'feature-preview',
	component: lazy(() => import('./featurePreview/AccountFeaturePreviewPage')),
});
registerAccountRoute('/theme', {
	name: 'theme',
	component: lazy(() => import('./themes/ThemePage')),
});

registerAccountRoute('/accessibility', {
	name: 'accessibility',
	component: lazy(() => import('./accessibility/AccessibilityPage')),
});
