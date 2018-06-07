Package.describe({
	name: 'rocketchat:push-notifications',
	version: '0.0.1',
	summary: 'Push Notifications Settings',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/stylesheets/pushNotifications.css',
		'client/views/pushNotificationsFlexTab.html',
		'client/views/pushNotificationsFlexTab.js',
		'client/tabBar.js'
	], 'client');

	api.addFiles([
		'server/methods/saveNotificationSettings.js',
		'server/models/Subscriptions.js'
	], 'server');
});
