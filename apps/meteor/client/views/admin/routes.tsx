import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface RouterPaths {
		'/admin': '/admin';
		'/admin/import': '/admin/import';
		'/admin/import/new': '/admin/import/new';
		'/admin/import/prepare': '/admin/import/prepare';
		'/admin/import/progress': '/admin/import/progress';
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
