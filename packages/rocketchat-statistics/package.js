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
		'rocketchat:lib',
		'sha'
	]);

	// Statistics
	api.addFiles('lib/rocketchat.js', [ 'client', 'server' ]);
	api.addFiles([
		'server/models/Statistics.js',
		'server/functions/getUsages.js',
		'server/functions/get.js',
		'server/functions/save.js',
		'server/methods/getStatistics.js'
	], 'server');
});
