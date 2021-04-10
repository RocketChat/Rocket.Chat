import * as AppLayout from '../../../client/lib/appLayout';
import { registerAdminRoute } from '../../../client/views/admin';

registerAdminRoute('/chatpal', {
	name: 'chatpal-admin',
	action() {
		return AppLayout.render('main', { center: 'ChatpalAdmin' });
	},
});
