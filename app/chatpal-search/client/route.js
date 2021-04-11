import { appLayout } from '../../../client/lib/appLayout';
import { registerAdminRoute } from '../../../client/views/admin';

registerAdminRoute('/chatpal', {
	name: 'chatpal-admin',
	action() {
		return appLayout.render('main', { center: 'ChatpalAdmin' });
	},
});
