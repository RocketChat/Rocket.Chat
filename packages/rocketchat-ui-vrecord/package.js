Package.describe({
	'name': 'rocketchat:ui-vrecord',
	'version': '0.0.1',
	'description': 'Video upload with on the fly recording',
	'documentation': 'README.md'
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'templating',
		'tracker',
		'rocketchat:lib'
	]);


	api.addFiles('client/vrecord.css', 'client');

	api.addFiles('client/vrecord.html', 'client');
	api.addFiles('client/vrecord.js', 'client');

	api.addFiles('server/settings.js', 'server');
	api.mainModule('client/VRecDialog.js', 'client');
});
