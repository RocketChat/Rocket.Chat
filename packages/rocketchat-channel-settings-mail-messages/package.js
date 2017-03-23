Package.describe({
	name: 'rocketchat:channel-settings-mail-messages',
	version: '0.0.1',
	summary: 'Channel Settings - Mail Messages',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'coffeescript',
		'templating',
		'reactive-var',
		'less',
		'rocketchat:lib',
		'rocketchat:channel-settings',
		'mongo'
	]);

	api.addFiles([
		'client/lib/startup.coffee',
		'client/stylesheets/mail-messages.less',
		'client/views/channelSettingsMailMessages.html',
		'client/views/channelSettingsMailMessages.coffee',
		'client/views/mailMessagesInstructions.html',
		'client/views/mailMessagesInstructions.coffee'
	], 'client');


	api.addFiles([
		'server/lib/startup.coffee',
		'server/methods/mailMessages.coffee'
	], 'server');
});
