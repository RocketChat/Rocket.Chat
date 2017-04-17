Package.describe({
	name: 'rocketchat:message-mark-as-unread',
	version: '0.0.1',
	summary: 'Mark a message as unread'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:logger',
		'rocketchat:ui'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/actionButton.js'
	], 'client');

	api.addFiles([
		'server/logger.js',
		'server/unreadMessages.js'
	], 'server');
});
