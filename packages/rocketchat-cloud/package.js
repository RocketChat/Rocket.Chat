Package.describe({
	name: 'rocketchat:cloud',
	version: '0.0.1',
	summary: 'Package which interacts with the Rocket.Chat Cloud offerings.',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'templating',
	]);

	api.addFiles([
		'client/admin/cloud.html',
		'client/admin/cloud.js',
		'client/admin/callback.html',
		'client/admin/callback.js'
	], 'client');

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
