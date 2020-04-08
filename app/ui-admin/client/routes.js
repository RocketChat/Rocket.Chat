import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Meteor } from 'meteor/meteor';

import { renderRouteComponent } from '../../../client/reactAdapters';

export const routes = FlowRouter.group({
	prefix: '/admin',
	name: 'admin',
});

routes.route('/info', {
	name: 'admin-info',
	action: () => {
		renderRouteComponent(() => import('./components/info/InformationRoute'), {
			template: 'main',
			region: 'center',
		});
	},
});

routes.route('/users', {
	name: 'admin-users',
	action: async () => {
		await import('./users/views');
		BlazeLayout.render('main', { center: 'adminUsers' });
	},
});

routes.route('/rooms', {
	name: 'admin-rooms',
	action: async () => {
		await import('./rooms/views');
		BlazeLayout.render('main', { center: 'adminRooms' });
	},
});

Meteor.startup(() => {
	routes.route('/:group+', {
		name: 'admin',
		action: () => {
			renderRouteComponent(() => import('./components/settings/SettingsRoute'), {
				template: 'main',
				region: 'center',
			});
		},
	});
});
