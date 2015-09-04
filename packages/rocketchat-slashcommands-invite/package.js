Package.describe({
	name: 'rocketchat:slashcommands-invite',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /me commands',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'check',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('invite.coffee');
});

Package.onTest(function(api) {

});
