Package.describe({
	name: 'rocketchat:gitlab',
	version: '0.0.1',
	summary: 'RocketChat settings for GitLab Oauth Flow'
});

// Loads all i18n.json files into tapi18nFiles
var _ = Npm.require('underscore');
var fs = Npm.require('fs');
tapi18nFiles = _.map(fs.readdirSync('packages/rocketchat-gitlab/i18n'), function(filename) { return 'i18n/' + filename });

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use(["tap:i18n@1.5.1"], ["client", "server"]);
	api.add_files("package-tap.i18n", ["client", "server"]);
	api.use(['templating'], 'client');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1',
		'gitlab@1.1.4-plugins.0'
	]);

	api.addFiles('startup.coffee', 'server');
	api.addFiles('common.coffee', [ 'client', 'server' ]);

	api.add_files(tapi18nFiles, ["client", "server"]);
});

Package.onTest(function(api) {

});
