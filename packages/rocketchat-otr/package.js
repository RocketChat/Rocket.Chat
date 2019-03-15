Package.describe({
	name: 'rocketchat:otr',
	version: '0.0.1',
	summary: 'Off-the-record messaging for Rocket.Chat',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:utils',
		'rocketchat:promises',
		'rocketchat:settings',
		'rocketchat:models',
		'rocketchat:notifications',
		'rocketchat:ui-utils',
		'tracker',
		'reactive-var',
		'templating',
	]);
	api.addFiles('client/stylesheets/otr.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
