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

	api.addFiles('server/asset/chatpal-icon.svg', 'server', {isAsset:true});

	api.addFiles([
		'server/provider/provider.js',
		'server/provider/index.js',
		'server/utils/logger.js',
		'server/utils/utils.js',
		'server/asset/config.js'
	], 'server');

	api.addFiles([
		'client/template/suggestion.html',
		'client/template/suggestion.js',
		'client/template/result.html',
		'client/template/result.js',
		'client/template/admin.html',
		'client/template/admin.js',
		'client/style.css',
		'client/route.js'
	], 'client');
});
