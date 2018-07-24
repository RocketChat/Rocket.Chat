Package.describe({
	name: 'rocketchat:sau',
	version: '0.0.1',
	summary: 'Server Session Monitor for SAU(Simultaneously Active Users)',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('ecmascript');
	/*
	api.use('templating', 'client');
	*/
	api.addFiles([
		'server/models/Sessions.js',
		'server/startup.js',
		'server/lib/BucketStore.js',
		'server/lib/SAUMonitor.js'
	], 'server');

});
