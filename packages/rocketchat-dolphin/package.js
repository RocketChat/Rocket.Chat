// Original: https://github.com/boonex/rocket.chat/blob/master/packages/rocketchat-dolphin/package.js
Package.describe({
	name: 'rocketchat:dolphin',
	version: '0.0.2',
	summary: 'RocketChat settings for Dolphin Oauth'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use('coffeescript');
	api.use('service-configuration');
	api.use('rocketchat:lib@0.0.1');
	api.use('rocketchat:custom-oauth');
	api.addFiles('common.coffee');
	api.addFiles('login-button.css', 'client');
	api.addFiles('startup.coffee', 'server');

    // TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-dolphin/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-dolphin/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n@1.6.1', ['client', 'server']);
	api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);
});
