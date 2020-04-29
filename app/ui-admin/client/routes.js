import { FlowRouter } from 'meteor/kadira:flow-router';
// import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Meteor } from 'meteor/meteor';

import { renderRouteComponent } from '../../../client/reactAdapters';

const routeGroup = FlowRouter.group({
	name: 'admin',
	prefix: '/admin',
});

export const registerAdminRoute = (path, { lazyRouteComponent, props, action, ...options } = {}) => {
	routeGroup.route(path, {
		...options,
		action: (params, queryParams) => {
			if (action) {
				action(params, queryParams);
				return;
			}

			renderRouteComponent(() => import('../../../client/admin/AdministrationRouter'), {
				template: 'main',
				region: 'center',
				propsFn: () => ({ lazyRouteComponent, ...options, params, queryParams, ...props }),
			});
		},
	});
};

registerAdminRoute('/', {
	triggersEnter: [(context, redirect) => {
		redirect('admin-info');
	}],
});

registerAdminRoute('/info', {
	name: 'admin-info',
	lazyRouteComponent: () => import('../../../client/admin/info/InformationRoute'),
});

registerAdminRoute('/import', {
	name: 'admin-import',
	lazyRouteComponent: () => import('../../../client/admin/import/ImportRoute'),
	props: { page: 'history' },
});

registerAdminRoute('/import/new/:importerKey?', {
	name: 'admin-import-new',
	lazyRouteComponent: () => import('../../../client/admin/import/ImportRoute'),
	props: { page: 'new' },
});

registerAdminRoute('/import/prepare', {
	name: 'admin-import-prepare',
	lazyRouteComponent: () => import('../../../client/admin/import/ImportRoute'),
	props: { page: 'prepare' },
});

registerAdminRoute('/import/progress', {
	name: 'admin-import-progress',
	lazyRouteComponent: () => import('../../../client/admin/import/ImportRoute'),
	props: { page: 'progress' },
});

registerAdminRoute('/mailer', {
	name: 'admin-mailer',
	lazyRouteComponent: () => import('../../../client/admin/mailer/MailerRoute'),
});

registerAdminRoute('/custom-user-status/:context?/:id?', {
	name: 'custom-user-status',
	lazyRouteComponent: () => import('../../../client/admin/customUserStatus/CustomUserStatusRoute'),
});

registerAdminRoute('/users/:context?/:id?', {
	name: 'admin-users',
	lazyRouteComponent: () => import('../../../client/admin/users/UsersRoute'),
});

registerAdminRoute('/rooms/:context?/:id?', {
	name: 'admin-rooms',
	lazyRouteComponent: () => import('../../../client/admin/rooms/RoomsRoute'),
});

registerAdminRoute('/invites', {
	name: 'invites',
	lazyRouteComponent: () => import('../../../client/admin/invites/InvitesRoute'),
});

registerAdminRoute('/view-logs', {
	name: 'admin-view-logs',
	lazyRouteComponent: () => import('../../../client/admin/viewLogs/ViewLogsRoute'),
});

Meteor.startup(() => {
	registerAdminRoute('/:group+', {
		name: 'admin',
		lazyRouteComponent: () => import('../../../client/admin/settings/SettingsRoute'),
	});
});
