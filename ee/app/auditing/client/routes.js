import { FlowRouter } from 'meteor/kadira:flow-router';

import * as AppLayout from '../../../../client/lib/appLayout';

FlowRouter.route('/audit', {
	name: 'audit-home',
	action() {
		AppLayout.render('main', { center: 'auditPage' });
	},
});

FlowRouter.route('/audit-log', {
	name: 'audit-log',
	action() {
		AppLayout.render('main', { center: 'auditLogPage' });
	},
});
