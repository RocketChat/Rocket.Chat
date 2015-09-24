Package.describe({
	name: 'rocketchat:importer-test',
	version: '0.0.1',
	summary: 'Importer for test',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'check',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('main.coffee');
});

Package.onTest(function(api) {

});
