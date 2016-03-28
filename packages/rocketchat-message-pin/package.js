Package.describe({
	name: 'rocketchat:message-pin',
	version: '0.0.1',
	summary: 'Pin Messages'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'underscore',
		'less@2.5.0',
		'rocketchat:lib'
	]);

	api.addFiles([
		'client/lib/PinnedMessage.coffee',
		'client/actionButton.coffee',
		'client/messageType.js',
		'client/pinMessage.coffee',
		'client/tabBar.coffee',
		'client/views/pinnedMessages.html',
		'client/views/pinnedMessages.coffee',
		'client/views/stylesheets/messagepin.less',
	], 'client');

	api.addFiles([
		'server/settings.coffee',
		'server/pinMessage.coffee',
		'server/publications/pinnedMessages.coffee',
		'server/startup/indexes.coffee'
	], 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-message-pin/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-message-pin/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});
