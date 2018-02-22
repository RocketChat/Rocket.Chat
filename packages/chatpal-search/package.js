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
		'rocketchat:search'
	]);

	api.addFiles([
		'server/provider.js'
	], 'server');

	api.addFiles([
		'client/admin.html',
		'client/admin.js',
		'client/result.html',
		'client/result.js'
	], 'client');
});
