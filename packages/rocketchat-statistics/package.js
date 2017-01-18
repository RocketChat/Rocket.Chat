Package.describe({
	name: 'rocketchat:statistics',
	version: '0.0.1',
	summary: 'Statistics generator',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'coffeescript',
		'rocketchat:lib'
	]);

	// Statistics
	api.addFiles('lib/rocketchat.coffee', [ 'client', 'server' ]);
	api.addFiles([
		'server/models/Statistics.coffee',
		'server/functions/get.js',
		'server/functions/save.coffee',
		'server/methods/getStatistics.coffee'
	], 'server');
});
