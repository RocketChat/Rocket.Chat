Package.describe({
	name: 'rocketchat:push-notifications',
	version: '0.0.1',
	summary: 'Push Notifications Settings',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'ecmascript',
		'underscore',
		'less@2.5.0',
		'rocketchat:lib'
	]);

	api.addFiles([
		'client/stylesheets/pushNotifications.less',
		'client/views/pushNotificationsFlexTab.html',
		'client/views/pushNotificationsFlexTab.js',
		'client/tabBar.js'
	], 'client');

	api.addFiles([
		'server/methods/saveNotificationSettings.js',
		'server/models/Subscriptions.js'
	], 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-push-notifications/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-push-notifications/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});
