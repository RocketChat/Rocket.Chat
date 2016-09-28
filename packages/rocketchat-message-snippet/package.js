/* globals Package */
Package.describe({
	name: 'rocketchat:message-snippet',
	version: '0.0.1',
	summary: 'Transform your multilines messages into snippet files.',
	git: '',
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('random');
	api.use('underscore');
	api.use('tracker');
	api.use('webapp');
	api.use('templating', 'client');


	// Server
	api.addFiles([
		'server/startup/settings.js',
		'server/methods/snippetMessage.js',
		'server/publications/snippetedMessages.js'
	], 'server');

	// Client
	api.addFiles([
		'client/lib/SnippetedMessage.js',
		'client/actionButton.js',
		'client/messageType.js',
		'client/snippetMessage.js',
		'client/tabBar.js',
		'client/views/snippetedMessages.html',
		'client/views/snippetedMessages.js'
    ], 'client');

	// api.export('multilinePasteHandler');
	// api.export('multilinePaste');
});

Npm.depends({
	'mime-types': '2.1.11'
});

