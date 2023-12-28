import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'admin-index': {
			pathname: '/admin';
			pattern: '/admin';
		};
		'custom-sounds': {
			pathname: `/admin/sounds${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/sounds/:context?/:id?';
		};
		'info': {
			pathname: '/admin/info';
			pattern: '/admin/info';
		};
		'workspace': {
			pathname: '/admin/workspace';
			pattern: '/admin/workspace';
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
			pathname: `/admin/third-party-login${`/${'new' | 'edit'}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/third-party-login/:context?/:id?';
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
			pathname: `/admin/emoji${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/emoji/:context?/:id?';
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
		'admin-view-logs': {
			pathname: '/admin/reports';
			pattern: '/admin/reports';
		};
		'federation-dashboard': {
			pathname: '/admin/federation';
			pattern: '/admin/federation';
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
		'device-management': {
			pathname: `/admin/device-management${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/device-management/:context?/:id?';
		};
		'engagement-dashboard': {
			pathname: `/admin/engagement${`/${string}` | ''}`;
			pattern: '/admin/engagement/:tab?';
		};
		'moderation-console': {
			pathname: `/admin/moderation${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/moderation/:context?/:id?';
		};
		'subscription': {
			pathname: `/admin/subscription`;
			pattern: '/admin/subscription';
		};
	}
}

export const registerAdminRoute = createRouteGroup(
	'admin',
	'/admin',
	lazy(() => import('./AdministrationRouter')),
);

registerAdminRoute('/sounds/:context?/:id?', {
	name: 'custom-sounds',
	component: lazy(() => import('./customSounds/CustomSoundsRoute')),
});

/** @deprecated in favor of `/workspace` route, this is a fallback to work in Mobile app, should be removed in the next major  */
registerAdminRoute('/info', {
	name: 'info',
	component: lazy(() => import('./workspace/WorkspaceRoute')),
});

registerAdminRoute('/workspace', {
	name: 'workspace',
	component: lazy(() => import('./workspace/WorkspaceRoute')),
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

registerAdminRoute('/third-party-login/:context?/:id?', {
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

registerAdminRoute('/emoji/:context?/:id?', {
	name: 'emoji-custom',
	component: lazy(() => import('./customEmoji/CustomEmojiRoute')),
});

registerAdminRoute('/users/:context?/:id?', {
	name: 'admin-users',
	component: lazy(() => import('./users/AdminUsersRoute')),
});

registerAdminRoute('/rooms/:context?/:id?', {
	name: 'admin-rooms',
	component: lazy(() => import('./rooms/RoomsRoute')),
});

registerAdminRoute('/invites', {
	name: 'invites',
	component: lazy(() => import('./invites/InvitesRoute')),
});

registerAdminRoute('/reports', {
	name: 'admin-view-logs',
	component: lazy(() => import('./viewLogs/ViewLogsRoute')),
});

registerAdminRoute('/federation', {
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

registerAdminRoute('/moderation/:context?/:id?', {
	name: 'moderation-console',
	component: lazy(() => import('./moderation/ModerationConsoleRoute')),
});

registerAdminRoute('/engagement/:tab?', {
	name: 'engagement-dashboard',
	component: lazy(() => import('../../../ee/client/views/admin/engagementDashboard/EngagementDashboardRoute')),
});

registerAdminRoute('/device-management/:context?/:id?', {
	name: 'device-management',
	component: lazy(() => import('../../../ee/client/views/admin/deviceManagement/DeviceManagementAdminRoute')),
});

registerAdminRoute('/subscription', {
	name: 'subscription',
	component: lazy(() => import('./subscription/SubscriptionRoute')),
});
