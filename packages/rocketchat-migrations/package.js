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
	api.use('ecmascript');
	api.use('underscore');
	api.use('check');
	api.use('mongo');
	api.use('momentjs:moment');

	api.addFiles('migrations.js', 'server');
});
