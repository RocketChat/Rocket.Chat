Package.describe({
	name: 'rocketchat:mailmessages',
	version: '0.0.1',
	summary: 'Mailer for Rocket.Chat',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'ddp-rate-limiter',
		'kadira:flow-router',
		'kadira:blaze-layout',
		'rocketchat:lib',
		'rocketchat:authorization',
		'templating',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
