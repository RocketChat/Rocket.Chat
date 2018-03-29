Package.describe({
	name: 'rocketchat:migrations',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('rocketchat:version');
	api.use('ecmascript');
	api.use('check');
	api.use('mongo');

	api.addFiles('migrations.js', 'server');
});
