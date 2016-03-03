Package.describe({
	name: 'rocketchat:crm',
	version: '0.0.1',
	summary: 'CRM Panel',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib',
	]);

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-crm/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-crm/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles("package-tap.i18n", ["client", "server"]);

	api.addFiles([
		'client/startup.coffee',
		'client/tabBar.coffee',
		'client/views/leads.html',
		'client/views/leads.coffee',
	], 'client');

	/*api.addFiles([
		'server/settings.coffee'
	], 'server');*/

	// TAPi18n -- needs to be added last
	api.addFiles(tapi18nFiles);
});

Package.onTest(function(api) {

});
