import { FlowRouter } from 'meteor/kadira:flow-router';

import * as BlazeLayout from '../../../client/lib/portals/blazeLayout';

FlowRouter.route('/reset-password/:token', {
	name: 'resetPassword',
	action() {
		BlazeLayout.render('loginLayout', { center: 'resetPassword' });
	},
});
