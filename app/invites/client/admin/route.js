import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../../ui-admin/client/routes';

routes.route('/invites', {
	name: 'invites',
	async action(/* params */) {
		await import('./adminInvites');
		BlazeLayout.render('main', { center: 'adminInvites' });
	},
});
