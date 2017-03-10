Package.describe({
	name: 'rocketchat:google-vision',
	version: '0.0.1',
	summary: 'Rocket.Chat Google Vision Integration',
	git: ''
});

Npm.depends({
	'@google-cloud/storage': '0.7.0',
	'@google-cloud/vision': '0.9.0'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'less',
		'rocketchat:lib'
	]);

	api.addFiles('client/googlevision.js', 'client');
	api.addFiles(['server/settings.js', 'server/googlevision.js', 'server/models/Messages.js'], 'server');
});
