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
		'rocketchat:lib@0.0.1'
	]);

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-message-star/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-message-star/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use(["tap:i18n@1.5.1"], ["client", "server"]);
	api.imply('tap:i18n');
	api.addFiles("package-tap.i18n", ["client", "server"]);

	api.addFiles('client/actionButton.coffee', ['client']);
	api.addFiles('client/starMessage.coffee', ['client']);
	
	api.addFiles('server/settings.coffee', ['server']);
	api.addFiles('server/starMessage.coffee', ['server']);

	// TAPi18n -- needs to be added last
	api.addFiles(tapi18nFiles, ["client", "server"]);
});

Package.onTest(function(api) {

});
