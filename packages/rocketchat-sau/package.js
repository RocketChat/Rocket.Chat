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
		'server/lib/rocketchat.js'
	], 'server');

});
