Package.describe({
	name: 'rocketchat-message-pin',
	version: '0.0.1',
	summary: 'RocketChat Message Pinning',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('button.coffee', 'client');
});

Package.onTest(function(api) {

});
