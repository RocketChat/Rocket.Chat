Package.describe({
	name: 'rocketchat:otr',
	version: '0.0.1',
	summary: 'Off-the-record messaging for Rocket.Chat',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'tracker',
		'reactive-var',
		'templating',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
