import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { t } from '../../utils';

FlowRouter.route('/admin/chatpal', {
	name: 'chatpal-admin',
	action() {
		return BlazeLayout.render('main', {
			center: 'ChatpalAdmin',
			pageTitle: t('Chatpal_AdminPage'),
		});
	},
});
