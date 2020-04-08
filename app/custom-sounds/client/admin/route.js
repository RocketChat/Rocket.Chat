import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../../ui-admin/client/routes';

routes.route('/custom-sounds', {
	name: 'custom-sounds',
	async action(/* params*/) {
		await import('./views');
		BlazeLayout.render('main', { center: 'adminSounds' });
	},
});
