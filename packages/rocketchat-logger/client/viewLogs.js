
this.stdout = new Mongo.Collection('stdout');

Meteor.startup(function() {
	RocketChat.AdminBox.addOption({
		href: 'admin-view-logs',
		i18nLabel: 'View_Logs',
		icon: 'post',
		permissionGranted() {
			return RocketChat.authz.hasAllPermission('view-logs');
		}
	});
});

FlowRouter.route('/admin/view-logs', {
	name: 'admin-view-logs',
	action() {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('View_Logs'),
			pageTemplate: 'viewLogs',
			noScroll: true
		});
	}
});
