Package.describe({
	name: 'rocketchat:jitsi',
	version: '0.0.1',
	summary: 'Package for Jitsi video conferencing integration',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	
	api.use('rocketchat:lib');
	api.use('ecmascript');

	api.use('templating', 'client');

	api.addFiles('client/tabBar.js', 'client');
	api.addFiles('client/jitsiPanel.html', 'client');
	api.addFiles('client/jitsiPanel.js', 'client');
});
