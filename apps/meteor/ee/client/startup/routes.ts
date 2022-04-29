import { FlowRouter } from 'meteor/kadira:flow-router';

import { appLayout } from '../../../client/lib/appLayout';

FlowRouter.route('/audit', {
	name: 'audit-home',
	action() {
		appLayout.renderMainLayout({ center: 'auditPage' });
	},
});

FlowRouter.route('/audit-log', {
	name: 'audit-log',
	action() {
		appLayout.renderMainLayout({ center: 'auditLogPage' });
	},
});
