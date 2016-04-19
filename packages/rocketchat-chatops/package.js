Package.describe({
	name: 'rocketchat:chatops',
	version: '0.0.1',
	summary: 'Chatops Panel',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib',
		'dburles:google-maps@1.1.5'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/startup.coffee',
		'client/tabBar.coffee',
		'client/views/chatops.html',
		'client/views/chatops.coffee',
		'client/views/codemirror.html',
		'client/views/codemirror.coffee',
		'client/views/droneflight.html',
		'client/views/droneflight.coffee',
		'client/views/dynamicUI.html',
		'client/views/stylesheets/chatops.css'
	], 'client');

	api.addFiles([
		'server/settings.coffee'
	], 'server');
});
