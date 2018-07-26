Package.describe({
	name: 'rocketchat:sau',
	version: '0.0.1',
	summary: 'Server Session Monitor for SAU(Simultaneously Active Users)',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib'
	]);
	api.addFiles([
		'server/models/Sessions.js',
		'server/startup/monitor.js'
	], 'server');

});
