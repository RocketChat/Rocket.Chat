Package.describe({
	name: 'rocketchat:error-handler',
	version: '1.0.0',
	summary: 'Rocket.Chat Error Handler',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'templating'
	]);

	api.addFiles('server/lib/RocketChat.ErrorHandler.js', 'server');
	api.addFiles('server/startup/settings.js', 'server');
});
