import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { hasAllPermission } from '../../authorization';
import { registerAdminRoute, registerAdminSidebarItem } from '../../ui-admin/client';
import { t } from '../../utils';

export const stdout = new Mongo.Collection(null);

Meteor.startup(function() {
	registerAdminSidebarItem({
		href: 'admin-view-logs',
		i18nLabel: 'View_Logs',
		icon: 'post',
		permissionGranted() {
			return hasAllPermission('view-logs');
		},
	});
});

registerAdminRoute('/view-logs', {
	name: 'admin-view-logs',
	async action() {
		await import('./views/viewLogs');
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('View_Logs'),
			pageTemplate: 'viewLogs',
			noScroll: true,
		});
	},
});
