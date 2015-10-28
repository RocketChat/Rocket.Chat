Package.describe({
	name: 'rocketchat:slashcommands-leave',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /leave commands',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);
	api.addFiles('leave.coffee');
});

Package.onTest(function(api) {

});
