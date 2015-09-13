Package.describe({
	name: 'rocketchat:slashcommands-join',
	version: '0.0.1',
	summary: 'Command handler for the /join command',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'check',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('join.coffee');
});

Package.onTest(function(api) {

});
