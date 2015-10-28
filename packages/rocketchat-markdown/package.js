Package.describe({
	name: 'rocketchat:markdown',
	version: '0.0.1',
	summary: 'Message pre-processor that will process selected markdown notations',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('settings.coffee', 'server');
	api.addFiles('markdown.coffee');
});

Package.onTest(function(api) {

});
