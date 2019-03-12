Package.describe({
	name: 'rocketchat:mailer',
	version: '0.0.1',
	summary: 'Mailer for Rocket.Chat',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'email',
		'ddp-rate-limiter',
		'rocketchat:i18n',
		'rocketchat:settings',
	]);

	api.mainModule('server/api.js', 'server');
});
