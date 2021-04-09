import * as AppLayout from '../../../client/lib/appLayout';
import { registerAdminRoute } from '../../../client/views/admin';
import { t } from '../../utils';

registerAdminRoute('/chatpal', {
	name: 'chatpal-admin',
	action() {
		return AppLayout.render('main', {
			center: 'ChatpalAdmin',
			pageTitle: t('Chatpal_AdminPage'),
		});
	},
});
