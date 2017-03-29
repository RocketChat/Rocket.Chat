Package.describe({
	name: 'rocketchat:channel-settings',
	version: '0.0.1',
	summary: 'Channel Settings Panel',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'coffeescript',
		'ecmascript',
		'reactive-var',
		'tracker',
		'templating',
		'less',
		'rocketchat:lib'
	]);

	api.addFiles([
		'client/lib/ChannelSettings.coffee',
		'client/startup/messageTypes.coffee',
		'client/startup/tabBar.coffee',
		'client/startup/trackSettingsChange.js',
		'client/views/channelSettings.html',
		'client/views/channelSettings.coffee',
		'client/stylesheets/channel-settings.less'
	], 'client');

	api.addFiles([
		'server/functions/saveReactWhenReadOnly.js',
		'server/functions/saveRoomType.coffee',
		'server/functions/saveRoomTopic.coffee',
		'server/functions/saveRoomAnnouncement.js',
		'server/functions/saveRoomName.coffee',
		'server/functions/saveRoomReadOnly.coffee',
		'server/functions/saveRoomDescription.coffee',
		'server/functions/saveRoomSystemMessages.coffee',
		'server/methods/saveRoomSettings.coffee',
		'server/models/Messages.coffee',
		'server/models/Rooms.coffee',
		'server/startup.js'
	], 'server');
});
