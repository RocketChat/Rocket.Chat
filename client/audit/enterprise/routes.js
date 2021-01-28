import { HTML } from 'meteor/htmljs';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { createTemplateForComponent } from '../../reactAdapters';

createTemplateForComponent('auditPage', () => import('../AuditPage'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%;' }), // eslint-disable-line new-cap
});
createTemplateForComponent('auditLogPage', () => import('../AuditLogPage'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%;' }), // eslint-disable-line new-cap
});

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
