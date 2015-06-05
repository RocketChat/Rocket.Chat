Package.describe({
	name: 'rocket:lib',
	version: '0.0.1',
	summary: 'Rocket libraries',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'underscore',
		'underscorestring:underscore.string'
	]);

	api.addFiles('lib/underscore.string.coffee', 'server');
	api.addFiles('lib/core.coffee', 'server');
	api.addFiles('lib/callbacks.coffee', 'server');

	api.export(['Rocket'], ['server']);
});

Package.onTest(function(api) {

});