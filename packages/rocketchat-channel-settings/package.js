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
		'server/methods/saveRoomSettings.coffee',
		'server/models/Messages.coffee'
	], 'server');

	// TAPi18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-channel-settings/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-channel-settings/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});
