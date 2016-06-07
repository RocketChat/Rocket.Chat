Package.describe({
	name: 'rocketchat:action-links',
	version: '0.0.1',
	summary: 'Add custom actions that call functions',
	git: '',
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('ecmascript');
	api.use('templating');
	api.use('rocketchat:lib');
	api.use('rocketchat:theme');
	api.use('rocketchat:ui');

	api.addFiles('client/init.js', 'client');
	api.addAssets('client/stylesheets/actionLinks.less', 'server');
	api.addFiles('loadStylesheets.js', 'server');

	api.addFiles('server/registerActionLinkFuncts.js', 'server');
	api.addFiles('server/actionLinkHandler.js', 'server');

});
