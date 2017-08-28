Package.describe({
	name: 'rocketchat:google-vision',
	version: '0.0.1',
	summary: 'Rocket.Chat Google Vision Integration',
	git: ''
});

Npm.depends({
	'@google-cloud/storage': '1.2.1',
	'@google-cloud/vision': '0.11.5'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib'
	]);

	api.addFiles('client/googlevision.js', 'client');
	api.addFiles(['server/settings.js', 'server/googlevision.js', 'server/models/Messages.js'], 'server');
});
