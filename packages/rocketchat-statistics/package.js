Package.describe({
	name: 'rocketchat:statistics',
	version: '0.0.1',
	summary: 'Statistics generator',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib'
	]);

	// Statistics
	api.addFiles('lib/rocketchat.coffee', [ 'client', 'server' ]);
	api.addFiles([
		'server/models/Statistics.coffee',
		'server/models/MRStatistics.coffee',
		'server/functions/get.coffee',
		'server/functions/save.coffee',
		'server/methods/getStatistics.coffee'
	], 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-statistics/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-statistics/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);

});
