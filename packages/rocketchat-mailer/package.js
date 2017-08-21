Package.describe({
	name: 'rocketchat:mailer',
	version: '0.0.1',
	summary: 'Mailer for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'ddp-rate-limiter',
		'kadira:flow-router',
		'rocketchat:lib',
		'rocketchat:authorization'
	]);

	api.use('templating', 'client');

	api.addFiles('lib/Mailer.js');

	api.addFiles([
		'client/startup.js',
		'client/router.js',
		'client/views/mailer.html',
		'client/views/mailer.js',
		'client/views/mailerUnsubscribe.html',
		'client/views/mailerUnsubscribe.js'
	], 'client');

	api.addFiles([
		'server/startup.js',
		'server/models/Users.js',
		'server/functions/sendMail.js',
		'server/functions/unsubscribe.js',
		'server/methods/sendMail.js',
		'server/methods/unsubscribe.js'
	], 'server');

	api.export('Mailer');
});
