import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/reset-password/:token', {
	name: 'resetPassword',
	action() {
		BlazeLayout.render('loginLayout', { center: 'resetPassword' });
	},
});
