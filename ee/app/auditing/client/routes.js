import { FlowRouter } from 'meteor/kadira:flow-router';

import * as BlazeLayout from '../../../../client/lib/portals/blazeLayout';

FlowRouter.route('/audit', {
	name: 'audit-home',
	action() {
		BlazeLayout.render('main', { center: 'auditPage' });
	},
});

FlowRouter.route('/audit-log', {
	name: 'audit-log',
	action() {
		BlazeLayout.render('main', { center: 'auditLogPage' });
	},
});
