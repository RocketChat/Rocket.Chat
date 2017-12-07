Package.describe({
	name: 'rocketchat:message-pin',
	version: '0.0.1',
	summary: 'Pin Messages'
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/lib/PinnedMessage.js',
		'client/actionButton.js',
		'client/messageType.js',
		'client/pinMessage.js',
		'client/tabBar.js',
		'client/views/pinnedMessages.html',
		'client/views/pinnedMessages.js',
		'client/views/stylesheets/messagepin.css'
	], 'client');

	api.addFiles([
		'server/settings.js',
		'server/pinMessage.js',
		'server/publications/pinnedMessages.js',
		'server/startup/indexes.js'
	], 'server');
});
