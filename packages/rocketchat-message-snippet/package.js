/* globals Package */
Package.describe({
	name: 'rocketchat:message-snippet',
	version: '0.0.1',
	summary: 'Transform your multilines messages into snippet files.',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:file',
		'rocketchat:markdown',
		'rocketchat:theme',
		'less',
		'random',
		'underscore',
		'tracker',
		'webapp'
	]);

	api.use([
		'templating',
		'kadira:flow-router'
	], 'client');


	// Server
	api.addFiles([
		'server/startup/settings.js',
		'server/methods/snippetMessage.js',
		'server/requests.js',
		'server/publications/snippetedMessagesByRoom.js',
		'server/publications/snippetedMessage.js'
	], 'server');

	// Client
	api.addFiles([
		'client/lib/collections.js',
		'client/actionButton.js',
		'client/messageType.js',
		'client/snippetMessage.js',
		'client/router.js',
		'client/page/snippetPage.html',
		'client/page/snippetPage.js',
		'client/tabBar/tabBar.js',
		'client/tabBar/views/snippetedMessages.html',
		'client/tabBar/views/snippetMessage.html',
		'client/tabBar/views/snippetedMessages.js',
		'client/tabBar/views/snippetMessage.js',
		'client/page/stylesheets/snippetPage.less'
	], 'client');

});
