Package.describe({
	name: 'rocketchat:wordpress',
	version: '0.0.1',
	summary: 'RocketChat settings for WordPress Oauth Flow'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use('coffeescript');
	api.use('rocketchat:lib');
	api.use('rocketchat:custom-oauth');
	api.addFiles('common.coffee');
	api.addFiles('wordpress-login-button.css', 'client');
	api.addFiles('startup.coffee', 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-wordpress/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-wordpress/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});
