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
		'kadira:flow-router',
		'meteorhacks:inject-initial'
	]);

	api.addFiles('server/chatpal-icon.svg', 'server', {isAsset:true});

	api.addFiles([
		'server/provider.js',
		'server/logger.js',
		'server/config.js',
		'server/index.js',
		'server/utils.js'
	], 'server');

	api.addFiles([
		'client/template/result.html',
		'client/template/result.js',
		'client/template/admin.html',
		'client/template/admin.js',
		'client/style.css',
		'client/route.js'
	], 'client');
});
