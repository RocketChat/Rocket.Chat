import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { t } from '/app/utils';

FlowRouter.route('/admin/chatpal', {
	name: 'chatpal-admin',
	action() {
		return BlazeLayout.render('main', {
			center: 'ChatpalAdmin',
			pageTitle: t('Chatpal_AdminPage'),
		});
	},
});
