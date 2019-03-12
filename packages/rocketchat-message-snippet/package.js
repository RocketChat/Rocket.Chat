Package.describe({
	name: 'rocketchat:message-snippet',
	version: '0.0.1',
	summary: 'Transform your multilines messages into snippet files.',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'rocketchat:utils',
		'rocketchat:lib',
		'rocketchat:file',
		'rocketchat:markdown',
		'rocketchat:settings',
		'rocketchat:ui-utils',
		'rocketchat:theme',
		'rocketchat:models',
		'rocketchat:authorization',
		'rocketchat:callbacks',
		'random',
		'tracker',
		'webapp',
		'templating',
		'kadira:flow-router',
		'kadira:blaze-layout',
	]);
	api.addFiles('client/page/stylesheets/snippetPage.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
