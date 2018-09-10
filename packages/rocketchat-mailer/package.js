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
	Npm.depends({
		juice: '4.3.2',
	});

	api.mainModule('server/api.js', 'server');
});
