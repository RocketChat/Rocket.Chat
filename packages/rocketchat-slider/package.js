Package.describe({
	name: 'rocketchat:slider',
	version: '0.0.1',
	summary: 'UI slider component for input range.',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('templating', 'client');
	api.use('rocketchat:theme');

	api.addFiles('rocketchat-slider.html', 'client');
	api.addFiles('rocketchat-slider.js', 'client');
});
