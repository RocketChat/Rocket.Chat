import { FlowRouter } from 'meteor/kadira:flow-router';

import { appLayout } from '../../../../client/lib/appLayout';

FlowRouter.route('/audit', {
	name: 'audit-home',
	action() {
		appLayout.render('main', { center: 'auditPage' });
	},
});

FlowRouter.route('/audit-log', {
	name: 'audit-log',
	action() {
		appLayout.render('main', { center: 'auditLogPage' });
	},
});
