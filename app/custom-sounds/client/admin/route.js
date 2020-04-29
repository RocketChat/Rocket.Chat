import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../../client/admin';

registerAdminRoute('/custom-sounds/:context?', {
	name: 'custom-sounds',
	async action(/* params*/) {
		await import('./views');
		BlazeLayout.render('main', { center: 'adminSounds' });
	},
});
