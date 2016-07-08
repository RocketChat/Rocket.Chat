Package.describe({
	name: 'rocketchat:channel-settings',
	version: '0.0.1',
	summary: 'Channel Settings Panel',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'reactive-var',
		'tracker',
		'templating',
		'less@2.5.0',
		'rocketchat:lib'
	]);

	api.addFiles([
		'client/lib/ChannelSettings.coffee',
		'client/startup/messageTypes.coffee',
		'client/startup/tabBar.coffee',
		'client/startup/trackSettingsChange.coffee',
		'client/views/channelSettings.html',
		'client/views/channelSettings.coffee',
		'client/stylesheets/channel-settings.less'
	], 'client');

	api.addFiles([
		'server/functions/saveRoomType.coffee',
		'server/functions/saveRoomTopic.coffee',
		'server/functions/saveRoomName.coffee',
		'server/functions/saveRoomDescription.coffee',
		'server/methods/saveRoomSettings.coffee',
		'server/models/Messages.coffee',
		'server/models/Rooms.coffee'
	], 'server');
});
