Package.describe({
	name: 'rocketchat:message-star',
	version: '0.0.1',
	summary: 'Star Messages',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/lib/StarredMessage.js',
		'client/actionButton.js',
		'client/starMessage.js',
		'client/tabBar.js',
		'client/views/starredMessages.html',
		'client/views/starredMessages.js',
		'client/views/stylesheets/messagestar.css'
	], 'client');

	api.addFiles([
		'server/settings.js',
		'server/starMessage.js',
		'server/publications/starredMessages.js',
		'server/startup/indexes.js'
	], 'server');
});
