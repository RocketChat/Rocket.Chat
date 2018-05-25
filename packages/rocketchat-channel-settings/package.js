Package.describe({
	name: 'rocketchat:channel-settings',
	version: '0.0.1',
	summary: 'Channel Settings Panel',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'reactive-var',
		'tracker',
		'templating',
		'rocketchat:lib'
	]);

	api.addFiles([
		'client/lib/ChannelSettings.js',
		'client/startup/messageTypes.js',
		'client/startup/tabBar.js',
		'client/startup/trackSettingsChange.js',
		'client/views/channelSettings.html',
		'client/views/channelSettings.js',
		'client/stylesheets/channel-settings.css'
	], 'client');

	api.addFiles([
		'server/functions/saveReactWhenReadOnly.js',
		'server/functions/saveRoomType.js',
		'server/functions/saveRoomTopic.js',
		'server/functions/saveRoomCustomFields.js',
		'server/functions/saveRoomAnnouncement.js',
		'server/functions/saveRoomName.js',
		'server/functions/saveRoomReadOnly.js',
		'server/functions/saveRoomDescription.js',
		'server/functions/saveRoomSystemMessages.js',
		'server/methods/saveRoomSettings.js',
		'server/models/Messages.js',
		'server/models/Rooms.js',
		'server/startup.js'
	], 'server');
});
