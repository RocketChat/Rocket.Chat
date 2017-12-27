Package.describe({
	name: 'rocketchat:livestream',
	version: '0.0.1',
	summary: 'Embed livestream to Rocket.Chat channels',
	git: ''
});

Package.onUse(function(api) {
	api.use('templating', 'client');
	api.use([
		'ecmascript',
		'rocketchat:lib'
	]);
	api.addFiles([
		'client/views/liveStreamTab.html',
		'client/views/liveStreamTab.js',
		'client/tabBar.js'
	], 'client');

	api.addFiles('server/models/Rooms.js', 'server');
	api.addFiles('server/functions/saveStreamingOptions.js', 'server');

});
