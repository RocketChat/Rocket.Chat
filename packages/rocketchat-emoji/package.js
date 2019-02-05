Package.describe({
	name: 'rocketchat:emoji',
	version: '1.0.0',
	summary: 'Package and message pre-processor that supports aggregating multiple emoji packages',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:callbacks',
		'rocketchat:utils',
		'htmljs',
	]);

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
