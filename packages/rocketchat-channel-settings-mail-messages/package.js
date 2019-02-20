Package.describe({
	name: 'rocketchat:channel-settings-mail-messages',
	version: '0.0.1',
	summary: 'Channel Settings - Mail Messages',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'reactive-var',
		'less',
		'rocketchat:ui-utils',
		'rocketchat:models',
		'rocketchat:authorization',
		'rocketchat:settings',
		'mizzao:autocomplete',
		'mongo',
		'rocketchat:utils',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
