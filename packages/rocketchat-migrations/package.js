Package.describe({
	name: 'rocketchat:migrations',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('rocketchat:lib');
	api.use('rocketchat:version');
	api.use('coffeescript');

	api.addFiles('migrations.js', 'server');

	api.export('Migrations', 'server');
});

Package.onTest(function(api) {

});
