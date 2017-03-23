Package.describe({
	name: 'rocketchat:chatops',
	version: '0.0.1',
	summary: 'Chatops Panel',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'dburles:google-maps@1.1.5'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/startup.js',
		'client/tabBar.js',
		'client/views/chatops.html',
		'client/views/chatops.js',
		'client/views/codemirror.html',
		'client/views/codemirror.js',
		'client/views/droneflight.html',
		'client/views/droneflight.js',
		'client/views/dynamicUI.html',
		'client/views/stylesheets/chatops.css'
	], 'client');

	api.addFiles([
		'server/settings.js'
	], 'server');
});
