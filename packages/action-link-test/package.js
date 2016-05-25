Package.describe({
	name: 'rocketchat:action-link-test',
	version: '0.0.1',
	summary: 'action links test',
	git: '',
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('ecmascript');
	api.use('templating');
	api.use('rocketchat:lib');
	
	api.addFiles('testActionLinks.js', 'server');
	api.addFiles('testUpdateMessage.js', 'server');

});
