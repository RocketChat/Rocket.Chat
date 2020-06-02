import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/audit', {
	name: 'audit-home',
	action() {
		BlazeLayout.render('main', { center: 'audit' });
	},
});

FlowRouter.route('/audit-log', {
	name: 'audit-log',
	action() {
		BlazeLayout.render('main', { center: 'auditLog' });
	},
});
