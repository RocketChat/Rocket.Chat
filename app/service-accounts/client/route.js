import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { t } from '../../utils';

FlowRouter.route('/admin/serviceaccount', {
	name: 'admin-serviceaccount',
	action() {
		return BlazeLayout.render('main', {
			center: 'serviceAccountDashboard',
			pageTitle: t('Service_account_applied'),
		});
	},
});
