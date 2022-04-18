Package.describe({
	name: 'rocketchat:google-natural-language',
	version: '0.0.1',
	summary: 'Rocket.Chat Google Natural Language integration',
	git: '',
});

Package.onUse(function (api) {
	api.use(['ecmascript', 'http', 'rocketchat:settings', 'rocketchat:callbacks', 'rocketchat:models', 'templating']);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
