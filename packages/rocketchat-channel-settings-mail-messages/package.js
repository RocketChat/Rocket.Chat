Package.describe({
	name: 'rocketchat:channel-settings-mail-messages',
	version: '0.0.1',
	summary: 'Channel Settings - Mail Messages',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'reactive-var',
		'less',
		'rocketchat:lib',
		'rocketchat:channel-settings',
		'mongo'
	]);

	api.addFiles([
		'client/lib/startup.js',
		'client/views/mailMessagesInstructions.html',
		'client/views/mailMessagesInstructions.js'
	], 'client');


	api.addFiles([
		'server/lib/startup.js',
		'server/methods/mailMessages.js'
	], 'server');
});
