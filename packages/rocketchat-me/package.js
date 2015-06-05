Package.describe({
	name: 'rocket:me',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /me commands',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocket:lib@0.0.1'
	]);

	api.addFiles('me.coffee', 'server');
});

Package.onTest(function(api) {

});