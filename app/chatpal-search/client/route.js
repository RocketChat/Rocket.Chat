import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../ui-admin/client/routes';
import { t } from '../../utils';

routes.route('/chatpal', {
	name: 'chatpal-admin',
	action() {
		return BlazeLayout.render('main', {
			center: 'ChatpalAdmin',
			pageTitle: t('Chatpal_AdminPage'),
		});
	},
});
