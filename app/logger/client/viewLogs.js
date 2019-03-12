import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { AdminBox } from '/app/ui-utils';
import { hasAllPermission } from '/app/authorization';
import { t } from '/app/utils';

export const stdout = new Mongo.Collection('stdout');

Meteor.startup(function() {
	AdminBox.addOption({
		href: 'admin-view-logs',
		i18nLabel: 'View_Logs',
		icon: 'post',
		permissionGranted() {
			return hasAllPermission('view-logs');
		},
	});
});

FlowRouter.route('/admin/view-logs', {
	name: 'admin-view-logs',
	action() {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('View_Logs'),
			pageTemplate: 'viewLogs',
			noScroll: true,
		});
	},
});
