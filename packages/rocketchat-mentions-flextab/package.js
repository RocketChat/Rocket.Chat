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
		'coffeescript',
		'underscore',
		'less',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/lib/MentionedMessage.coffee',
		'client/views/stylesheets/mentionsFlexTab.less',
		'client/views/mentionsFlexTab.html',
		'client/views/mentionsFlexTab.coffee',
		'client/actionButton.coffee',
		'client/tabBar.coffee'
	], 'client');

	api.addFiles([
		'server/publications/mentionedMessages.coffee'
	], 'server');
});
