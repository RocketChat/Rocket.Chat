import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../../client/admin';

registerAdminRoute('/emoji-custom', {
	name: 'emoji-custom',
	async action(/* params*/) {
		await import('./views');
		BlazeLayout.render('main', { center: 'adminEmoji' });
	},
});
