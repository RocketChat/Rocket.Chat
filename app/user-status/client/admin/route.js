import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../ui-admin/client';

registerAdminRoute('/user-status-custom', {
	name: 'user-status-custom',
	async action() {
		await import('./views');
		BlazeLayout.render('main', { center: 'adminUserStatus' });
	},
});
