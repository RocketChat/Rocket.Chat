Package.describe({
	name: 'assistify:migrations',
	version: '0.0.1',
	summary: 'Assistify migrations',
	git: 'http://github.com/assistify/Rocket.Chat',
	documentation: '',
});

Package.onUse(function(api) {
	api.versionsFrom('1.6.1.1');
	api.use('ecmascript');
	api.mainModule('migrations.js');
	api.addFiles('server/startup/migrations.js', 'server');
});
