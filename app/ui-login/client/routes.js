import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/reset-password/:token', {
	name: 'resetPassword',
	action() {
		BlazeLayout.render('loginLayout', { center: 'resetPassword' });
	},
});
