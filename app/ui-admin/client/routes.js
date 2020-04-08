import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Meteor } from 'meteor/meteor';

import { renderRouteComponent } from '../../../client/reactAdapters';

export const routeGroup = FlowRouter.group({
	name: 'admin',
	prefix: '/admin',
});

export const registerAdminRoute = (path, options) => {
	routeGroup.route(path, options);
};

registerAdminRoute('/', {
	triggersEnter: [(context, redirect) => {
		redirect('admin-info');
	}],
});

registerAdminRoute('/info', {
	name: 'admin-info',
	action: () => {
		renderRouteComponent(() => import('./components/info/InformationRoute'), {
			template: 'main',
			region: 'center',
		});
	},
});

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
		action: () => {
			renderRouteComponent(() => import('./components/settings/SettingsRoute'), {
				template: 'main',
				region: 'center',
			});
		},
	});
});
