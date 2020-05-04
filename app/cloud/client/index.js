import './admin/cloudRegisterManually';

import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../client/admin';

registerAdminRoute('/cloud/oauth-callback', {
	name: 'cloud-oauth-callback',
	action: async () => {
		await import('./admin/callback');
		BlazeLayout.render('main', { center: 'cloudCallback', old: true });
	},
});
