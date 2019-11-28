import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/admin/users', {
	name: 'admin-users',
	async action() {
		await import('./users/views');
		BlazeLayout.render('main', { center: 'adminUsers' });
	},
});


FlowRouter.route('/admin/rooms', {
	name: 'admin-rooms',
	async action() {
		await import('./rooms/views');
		BlazeLayout.render('main', { center: 'adminRooms' });
	},
});
