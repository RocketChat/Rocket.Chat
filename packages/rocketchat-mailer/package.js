Package.describe({
	name: 'rocketchat:mailer',
	version: '0.0.1',
	summary: 'Mailer for Rocket.Chat',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'ddp-rate-limiter',
	]);

	api.mainModule('server/api.js', 'server');
});
