import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../../ui-admin/client/routes';

routes.route('/user-status-custom', {
	name: 'user-status-custom',
	async action() {
		await import('./views');
		BlazeLayout.render('main', { center: 'adminUserStatus' });
	},
});
