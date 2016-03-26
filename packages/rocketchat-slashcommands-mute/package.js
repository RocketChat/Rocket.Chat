Package.describe({
	name: 'rocketchat:slashcommands-mute',
	version: '0.0.1',
	summary: 'Command handler for the /mute command',
	git: ''
});

Package.onUse(function(api) {

	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'check',
		'rocketchat:lib'
	]);

	api.addFiles('client/mute.coffee', 'client');
	api.addFiles('client/unmute.coffee', 'client');
	api.addFiles('server/mute.coffee', 'server');
	api.addFiles('server/unmute.coffee', 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-slashcommands-mute/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-slashcommands-mute/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});
