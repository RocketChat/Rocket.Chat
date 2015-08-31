Package.describe({
	name: 'rocketchat:statistics',
	version: '0.0.1',
	summary: 'Statistics generator',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'templating',
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	// TAPi18n
	api.use(["tap:i18n@1.5.1"], ["client", "server"]);
	api.addFiles("package-tap.i18n", ["client", "server"]);
	api.addFiles([
		"i18n/en.i18n.json",
	], ["client", "server"]);

	// Statistics
	api.addFiles('lib/rocketchat.coffee', [ 'client', 'server' ]);
	api.addFiles([
		'server/collections/Statistics.coffee',
		'server/functions/get.coffee',
		'server/functions/save.coffee',
		'server/methods/getStatistics.coffee'
	], 'server');

});

Package.onTest(function(api) {

});
