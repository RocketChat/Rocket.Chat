Package.describe({
	name: 'voismart:webnotifications',
	version: '0.0.1',
	summary: 'Web notifications',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:ui'
	]);

	api.addFiles([
		'notifications.coffee'
	], ['client']);

});
