import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/admin/user-status-custom', {
	name: 'user-status-custom',
	action(/* params */) {
		BlazeLayout.render('main', { center: 'adminUserStatus' });
	},
});
