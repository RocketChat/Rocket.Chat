import * as BlazeLayout from '../../../client/lib/portals/blazeLayout';
import { registerAdminRoute } from '../../../client/views/admin';
import { t } from '../../utils';

registerAdminRoute('/chatpal', {
	name: 'chatpal-admin',
	action() {
		return BlazeLayout.render('main', {
			center: 'ChatpalAdmin',
			pageTitle: t('Chatpal_AdminPage'),
		});
	},
});
