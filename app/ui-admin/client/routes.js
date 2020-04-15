import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
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

			renderRouteComponent(() => import('./components/AdministrationRouter'), {
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
	lazyRouteComponent: () => import('./components/info/InformationRoute'),
});

registerAdminRoute('/mailer', {
	name: 'admin-mailer',
	lazyRouteComponent: () => import('./components/mailer'),
});

// registerAdminRoute('/mailer', {
// 	name: 'admin-mailer',
// 	async action() {
// 		await import('./views');
// 		return BlazeLayout.render('main', {
// 			center: 'mailer',
// 		});
// 	},
// });

// FlowRouter.route('/mailer/unsubscribe/:_id/:createdAt', {
// 	name: 'mailer-unsubscribe',
// 	async action(params) {
// 		await import('./views');
// 		Meteor.call('Mailer:unsubscribe', params._id, params.createdAt);
// 		return BlazeLayout.render('mailerUnsubscribe');
// 	},
// });

registerAdminRoute('/users', {
	name: 'admin-users',
	action: async () => {
		await import('./users/views');
		BlazeLayout.render('main', { center: 'adminUsers' });
	},
});

registerAdminRoute('/rooms', {
	name: 'admin-rooms',
	action: async () => {
		await import('./rooms/views');
		BlazeLayout.render('main', { center: 'adminRooms' });
	},
});

Meteor.startup(() => {
	registerAdminRoute('/:group+', {
		name: 'admin',
		lazyRouteComponent: () => import('./components/settings/SettingsRoute'),
	});
});
