Package.describe({
	name: 'rocketchat:slashcommands-kick',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /kick commands',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('kick.coffee', ['server','client']);
});

Package.onTest(function(api) {

});
