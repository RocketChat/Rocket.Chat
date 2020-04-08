import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../ui-admin/client/routes';

registerAdminRoute('/invites', {
	name: 'invites',
	async action(/* params */) {
		await import('./adminInvites');
		BlazeLayout.render('main', { center: 'adminInvites' });
	},
});
