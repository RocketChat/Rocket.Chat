Package.describe({
	name: 'rocketchat:colors',
	version: '0.0.1',
	summary: 'Message pre-processor that will process colors',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('client.coffee', 'client');
	api.addFiles('style.css', 'client');
});

Package.onTest(function(api) {

});
