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
		'rocketchat:lib'
	]);

	// Statistics
	api.addFiles('client/lib/rocketchat.js', [ 'client' ]);
	api.addFiles([
		'server/models/Statistics.js',
		'server/lib/rocketchat.js',
		'server/functions/get.js',
		'server/functions/save.js',
		'server/methods/getStatistics.js'
	], 'server');
});
