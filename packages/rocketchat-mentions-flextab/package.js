Package.describe({
	name: 'rocketchat:mentions-flextab',
	version: '0.0.1',
	summary: 'Mentions Flextab',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'less',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/lib/MentionedMessage.js',
		'client/views/stylesheets/mentionsFlexTab.less',
		'client/views/mentionsFlexTab.html',
		'client/views/mentionsFlexTab.js',
		'client/actionButton.js',
		'client/tabBar.js'
	], 'client');

	api.addFiles([
		'server/publications/mentionedMessages.js'
	], 'server');
});
