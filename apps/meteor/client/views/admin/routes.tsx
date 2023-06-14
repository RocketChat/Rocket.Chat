import { lazy } from 'react';

import type { UpgradeTabVariant } from '../../../lib/upgradeTab';
import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface RouterPaths {
		'admin-index': {
			pathname: '/admin';
			pattern: '/admin';
		};
		'custom-sounds': {
			pathname: `/admin/custom-sounds${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/custom-sounds/:context?/:id?';
		};
		'admin-info': {
			pathname: '/admin/info';
			pattern: '/admin/info';
		};
		'admin-import': {
			pathname: '/admin/import';
			pattern: '/admin/import';
		};
		'admin-import-new': {
			pathname: `/admin/import/new${`/${string}` | ''}`;
			pattern: '/admin/import/new/:importerKey?';
		};
		'admin-import-prepare': {
			pathname: '/admin/import/prepare';
			pattern: '/admin/import/prepare';
		};
		'admin-import-progress': {
			pathname: '/admin/import/progress';
			pattern: '/admin/import/progress';
		};
		'admin-mailer': {
			pathname: '/admin/mailer';
			pattern: '/admin/mailer';
		};
		'admin-oauth-apps': {
			pathname: `/admin/oauth-apps${`/${'new' | 'edit'}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/oauth-apps/:context?/:id?';
		};
		'admin-integrations': {
			pathname: `/admin/integrations${`/${string}` | ''}${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/integrations/:context?/:type?/:id?';
		};
		'user-status': {
			pathname: `/admin/user-status${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/user-status/:context?/:id?';
		};
		'emoji-custom': {
			pathname: `/admin/emoji-custom${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/emoji-custom/:context?/:id?';
		};
		'admin-users': {
			pathname: `/admin/users${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/users/:context?/:id?';
		};
		'admin-rooms': {
			pathname: `/admin/rooms${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/rooms/:context?/:id?';
		};
		'invites': {
			pathname: '/admin/invites';
			pattern: '/admin/invites';
		};
		'cloud': {
			pathname: `/admin/cloud${`/${string}` | ''}`;
			pattern: '/admin/cloud/:page?';
		};
		'admin-view-logs': {
			pathname: '/admin/view-logs';
			pattern: '/admin/view-logs';
		};
		'federation-dashboard': {
			pathname: '/admin/federation-dashboard';
			pattern: '/admin/federation-dashboard';
		};
		'admin-permissions': {
			pathname: `/admin/permissions${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/permissions/:context?/:_id?';
		};
		'admin-email-inboxes': {
			pathname: `/admin/email-inboxes${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/email-inboxes/:context?/:_id?';
		};
		'admin-settings': {
			pathname: `/admin/settings${`/${string}` | ''}`;
			pattern: '/admin/settings/:group?';
		};
		'upgrade': {
			pathname: `/admin/upgrade${`/${UpgradeTabVariant}` | ''}`;
			pattern: '/admin/upgrade/:type?';
		};
		'moderation-console': {
			pathname: `/admin/moderation-console${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/moderation-console/:context?/:id?';
		};
	}
}

export const registerAdminRoute = createRouteGroup(
	'admin',
	'/admin',
	lazy(() => import('./AdministrationRouter')),
);

registerAdminRoute('/custom-sounds/:context?/:id?', {
	name: 'custom-sounds',
	component: lazy(() => import('./customSounds/CustomSoundsRoute')),
});

registerAdminRoute('/info', {
	name: 'admin-info',
	component: lazy(() => import('./info/InformationRoute')),
});

registerAdminRoute('/import', {
	name: 'admin-import',
	component: lazy(() => import('./import/ImportRoute')),
	props: { page: 'history' },
});

registerAdminRoute('/import/new/:importerKey?', {
	name: 'admin-import-new',
	component: lazy(() => import('./import/ImportRoute')),
	props: { page: 'new' },
});

registerAdminRoute('/import/prepare', {
	name: 'admin-import-prepare',
	component: lazy(() => import('./import/ImportRoute')),
	props: { page: 'prepare' },
});

registerAdminRoute('/import/progress', {
	name: 'admin-import-progress',
	component: lazy(() => import('./import/ImportRoute')),
	props: { page: 'progress' },
});

registerAdminRoute('/mailer', {
	name: 'admin-mailer',
	component: lazy(() => import('./mailer/MailerRoute')),
});

registerAdminRoute('/oauth-apps/:context?/:id?', {
	name: 'admin-oauth-apps',
	component: lazy(() => import('./oauthApps/OAuthAppsRoute')),
});

registerAdminRoute('/integrations/:context?/:type?/:id?', {
	name: 'admin-integrations',
	component: lazy(() => import('./integrations/IntegrationsRoute')),
});

registerAdminRoute('/user-status/:context?/:id?', {
	name: 'user-status',
	component: lazy(() => import('./customUserStatus/CustomUserStatusRoute')),
});

registerAdminRoute('/emoji-custom/:context?/:id?', {
	name: 'emoji-custom',
	component: lazy(() => import('./customEmoji/CustomEmojiRoute')),
});

registerAdminRoute('/users/:context?/:id?', {
	name: 'admin-users',
	component: lazy(() => import('./users/UsersRoute')),
});

registerAdminRoute('/rooms/:context?/:id?', {
	name: 'admin-rooms',
	component: lazy(() => import('./rooms/RoomsRoute')),
});

registerAdminRoute('/invites', {
	name: 'invites',
	component: lazy(() => import('./invites/InvitesRoute')),
});

registerAdminRoute('/cloud/:page?', {
	name: 'cloud',
	component: lazy(() => import('./cloud/CloudRoute')),
});

registerAdminRoute('/view-logs', {
	name: 'admin-view-logs',
	component: lazy(() => import('./viewLogs/ViewLogsRoute')),
});

registerAdminRoute('/federation-dashboard', {
	name: 'federation-dashboard',
	component: lazy(() => import('./federationDashboard/FederationDashboardRoute')),
});

registerAdminRoute('/permissions/:context?/:_id?', {
	name: 'admin-permissions',
	component: lazy(() => import('./permissions/PermissionsRouter')),
});

registerAdminRoute('/email-inboxes/:context?/:_id?', {
	name: 'admin-email-inboxes',
	component: lazy(() => import('./emailInbox/EmailInboxRoute')),
});

registerAdminRoute('/settings/:group?', {
	name: 'admin-settings',
	component: lazy(() => import('./settings/SettingsRoute')),
});

registerAdminRoute('/upgrade/:type?', {
	name: 'upgrade',
	component: lazy(() => import('./upgrade/UpgradePage')),
});

registerAdminRoute('/moderation-console/:context?/:id?', {
	name: 'moderation-console',
	component: lazy(() => import('./moderation/ModerationConsoleRoute')),
});
