Package.describe({
	name: 'rocketchat:tooltip',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('templating', 'client');
	api.use('rocketchat:lib');
	api.use('rocketchat:theme');
	api.use('rocketchat:ui-master');

	api.addFiles('client/tooltip.css', 'client');

	api.addFiles('client/rocketchat-tooltip.html', 'client');
	api.addFiles('client/rocketchat-tooltip.js', 'client');

	api.addFiles('client/init.js', 'client');
});
