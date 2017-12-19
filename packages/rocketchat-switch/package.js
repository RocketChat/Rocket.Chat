Package.describe({
	name: 'rocketchat:switch',
	version: '0.0.1',
	summary: 'UI switch component for checkbox inputs.',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('templating', 'client');
	api.use('rocketchat:theme');

	api.addFiles('rocketchat-switch.html', 'client');
	api.addFiles('rocketchat-switch.js', 'client');
});
