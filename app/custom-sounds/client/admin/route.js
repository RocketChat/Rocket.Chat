import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../ui-admin/client';

registerAdminRoute('/custom-sounds', {
	name: 'custom-sounds',
	async action(/* params*/) {
		await import('./views');
		BlazeLayout.render('main', { center: 'adminSounds' });
	},
});
