Package.describe({
	name: 'rocketchat:tooltip',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');
	api.use('ecmascript');
	api.use('templating', 'client');
	api.use('rocketchat:lib');
	api.use('rocketchat:theme');
	api.use('rocketchat:ui-master');

	api.addAssets('tooltip.less', 'server');
	api.addFiles('loadStylesheet.js', 'server');

	api.addFiles('rocketchat-tooltip.html', 'client');
	api.addFiles('rocketchat-tooltip.js', 'client');

	api.addFiles('init.js', 'client');
});
