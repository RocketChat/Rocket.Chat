Package.describe({
	name: 'chatpal:search',
	version: '0.0.1',
	summary: 'Chatpal Search Provider',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:utils',
		'rocketchat:settings',
		'rocketchat:models',
		'rocketchat:authorization',
	]);
	api.addAssets([
		'server/asset/chatpal-enter.svg',
		'server/asset/chatpal-logo-icon-darkblue.svg',
	], 'server');
	api.addFiles('client/style.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
