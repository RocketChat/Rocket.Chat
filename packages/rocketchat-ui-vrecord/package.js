Package.describe({
	'name': 'rocketchat:ui-vrecord',
	'version': '0.0.1',
	'description': 'Video upload with on the fly recording',
	'documentation': 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');

	api.use([
		'mongo',
		'ecmascript',
		'templating',
		'coffeescript',
		'underscore',
		'tracker',
		'rocketchat:lib',
		'less@2.5.1'
	]);


	api.addAssets('client/vrecord.less', 'server');

	api.addFiles('client/vrecord.html', 'client');
	api.addFiles('client/vrecord.coffee', 'client');
	api.addFiles('client/VRecDialog.coffee', 'client');

	api.addFiles('server/settings.coffee', 'server');
	api.addFiles('loadStylesheet.coffee', 'server');
});
