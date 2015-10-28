Package.describe({
	name: 'rocketchat:slashcommands-invite',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /me commands',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'check',
		'tracker',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('invite.coffee');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-slashcommands-invite/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-slashcommands-invite/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n@1.6.1', ['client', 'server']);
	api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);
});

Package.onTest(function(api) {

});
