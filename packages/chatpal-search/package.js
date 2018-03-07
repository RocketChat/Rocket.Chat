Package.describe({
	name: 'chatpal:search',
	version: '0.0.1',
	summary: 'Chatpal Search Provider',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:logger',
		'rocketchat:search',
		'kadira:flow-router'
	]);

	api.addFiles([
		'server/provider.js',
		'server/index.js'
	], 'server');

	api.addFiles([
		'client/style.css',
		'client/result.html',
		'client/key.html',
		'client/route.js',
		'client/result.js'
	], 'client');
});
