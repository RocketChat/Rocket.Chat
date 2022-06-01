import { appLayout } from '../../lib/appLayout';
import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerAdminRoute = createRouteGroup('admin', '/admin', () => import('./AdministrationRouter'));

registerAdminRoute('/custom-sounds/:context?/:id?', {
	name: 'custom-sounds',
	lazyRouteComponent: () => import('./customSounds/AdminSoundsRoute'),
});

registerAdminRoute('/apps/what-is-it', {
	name: 'admin-apps-disabled',
	lazyRouteComponent: () => import('./apps/AppsWhatIsIt'),
});

registerAdminRoute('/marketplace/:context?/:id?/:version?', {
	name: 'admin-marketplace',
	lazyRouteComponent: () => import('./apps/AppsRoute'),
});

registerAdminRoute('/apps/:context?/:id?/:version?/:tab?', {
	name: 'admin-apps',
	lazyRouteComponent: () => import('./apps/AppsRoute'),
});

registerAdminRoute('/info', {
	name: 'admin-info',
	lazyRouteComponent: () => import('./info/InformationRoute'),
});

registerAdminRoute('/import', {
	name: 'admin-import',
	lazyRouteComponent: () => import('./import/ImportRoute'),
	props: { page: 'history' },
});

registerAdminRoute('/import/new/:importerKey?', {
	name: 'admin-import-new',
	lazyRouteComponent: () => import('./import/ImportRoute'),
	props: { page: 'new' },
});

registerAdminRoute('/import/prepare', {
	name: 'admin-import-prepare',
	lazyRouteComponent: () => import('./import/ImportRoute'),
	props: { page: 'prepare' },
});

registerAdminRoute('/import/progress', {
	name: 'admin-import-progress',
	lazyRouteComponent: () => import('./import/ImportRoute'),
	props: { page: 'progress' },
});

registerAdminRoute('/mailer', {
	name: 'admin-mailer',
	lazyRouteComponent: () => import('./mailer/MailerRoute'),
});

registerAdminRoute('/oauth-apps/:context?/:id?', {
	name: 'admin-oauth-apps',
	lazyRouteComponent: () => import('./oauthApps/OAuthAppsRoute'),
});

registerAdminRoute('/integrations/:context?/:type?/:id?', {
	name: 'admin-integrations',
	lazyRouteComponent: () => import('./integrations/IntegrationsRoute'),
});

registerAdminRoute('/custom-user-status/:context?/:id?', {
	name: 'custom-user-status',
	lazyRouteComponent: () => import('./customUserStatus/CustomUserStatusRoute'),
});

registerAdminRoute('/emoji-custom/:context?/:id?', {
	name: 'emoji-custom',
	lazyRouteComponent: () => import('./customEmoji/CustomEmojiRoute'),
});

registerAdminRoute('/users/:context?/:id?', {
	name: 'admin-users',
	lazyRouteComponent: () => import('./users/UsersRoute'),
});

registerAdminRoute('/rooms/:context?/:id?', {
	name: 'admin-rooms',
	lazyRouteComponent: () => import('./rooms/RoomsRoute'),
});

registerAdminRoute('/invites', {
	name: 'invites',
	lazyRouteComponent: () => import('./invites/InvitesRoute'),
});

registerAdminRoute('/cloud/:page?', {
	name: 'cloud',
	lazyRouteComponent: () => import('./cloud/CloudRoute'),
});

registerAdminRoute('/view-logs', {
	name: 'admin-view-logs',
	lazyRouteComponent: () => import('./viewLogs/ViewLogsRoute'),
});

registerAdminRoute('/federation-dashboard', {
	name: 'federation-dashboard',
	lazyRouteComponent: () => import('./federationDashboard/FederationDashboardRoute'),
});

registerAdminRoute('/permissions/:context?/:_id?', {
	name: 'admin-permissions',
	lazyRouteComponent: () => import('./permissions/PermissionsRouter'),
});

registerAdminRoute('/email-inboxes/:context?/:_id?', {
	name: 'admin-email-inboxes',
	lazyRouteComponent: () => import('./emailInbox/EmailInboxRoute'),
});

registerAdminRoute('/settings/:group?', {
	name: 'admin-settings',
	lazyRouteComponent: () => import('./settings/SettingsRoute'),
});

registerAdminRoute('/chatpal', {
	name: 'chatpal-admin',
	action() {
		appLayout.renderMainLayout({ center: 'ChatpalAdmin' });
	},
});

registerAdminRoute('/upgrade/:type?', {
	name: 'upgrade',
	lazyRouteComponent: () => import('./upgrade/UpgradePage'),
});
