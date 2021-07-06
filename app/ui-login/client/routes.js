import { FlowRouter } from 'meteor/kadira:flow-router';

import { appLayout } from '../../../client/lib/appLayout';

FlowRouter.route('/reset-password/:token', {
	name: 'resetPassword',
	action() {
		appLayout.render('loginLayout', { center: 'resetPassword' });
	},
});
