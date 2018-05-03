Package.describe({
	name: 'rocketchat:cors',
	version: '0.0.1',
	summary: 'Enable CORS',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'webapp',
		'mongo'
	]);

	api.addFiles('cors.js', 'server');
	api.addFiles('common.js');
});
