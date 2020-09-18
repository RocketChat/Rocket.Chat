import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { createTemplateForComponent } from '../../../../client/reactAdapters';

createTemplateForComponent('auditPage', () => import('../../../client/audit/AuditPage'));
createTemplateForComponent('auditLogPage', () => import('../../../client/audit/AuditLogPage'));

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
