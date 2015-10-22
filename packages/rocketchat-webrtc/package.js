Package.describe({
	name: 'rocketchat:webrtc',
	version: '0.0.1',
	summary: 'Package WebRTC for Meteor server',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('rocketchat:lib@0.0.1');
	api.use('coffeescript');

	api.addFiles('adapter.js', 'client');
	api.addFiles('WebRTCClass.coffee', 'client');
	api.addFiles('screenShare.coffee', 'client');

	api.addFiles('server/settings.coffee', 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-webrtc/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-webrtc/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n@1.6.1', ['client', 'server']);
	api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);

	api.export('WebRTC');
});


Package.onTest(function(api) {});
