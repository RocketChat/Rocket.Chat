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

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-chatops/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-chatops/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles('package-tap.i18n', ['client', 'server']);

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
		'client/views/stylesheets/chatops.css',
	], 'client');

	api.addFiles([
		'server/settings.coffee'
	], 'server');

	// TAPi18n -- needs to be added last
	api.addFiles(tapi18nFiles);
});
