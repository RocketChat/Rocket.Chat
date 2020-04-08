import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../../ui-admin/client/routes';

routes.route('/emoji-custom', {
	name: 'emoji-custom',
	async action(/* params*/) {
		await import('./views');
		BlazeLayout.render('main', { center: 'adminEmoji' });
	},
});
