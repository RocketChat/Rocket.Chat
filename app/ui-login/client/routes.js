import { FlowRouter } from 'meteor/kadira:flow-router';

import * as AppLayout from '../../../client/lib/appLayout';

FlowRouter.route('/reset-password/:token', {
	name: 'resetPassword',
	action() {
		AppLayout.render('loginLayout', { center: 'resetPassword' });
	},
});
