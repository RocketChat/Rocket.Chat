Package.describe({
	name: 'rocketchat:message-star',
	version: '0.0.1',
	summary: 'Star Messages',
	git: ''
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
		'client/lib/StarredMessage.coffee',
		'client/actionButton.coffee',
		'client/starMessage.coffee',
		'client/tabBar.coffee',
		'client/views/starredMessages.html',
		'client/views/starredMessages.coffee',
		'client/views/stylesheets/messagestar.less',
	], 'client');

	api.addFiles([
		'server/settings.coffee',
		'server/starMessage.coffee',
		'server/publications/starredMessages.coffee',
		'server/startup/indexes.coffee'
	], 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-message-star/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-message-star/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});
