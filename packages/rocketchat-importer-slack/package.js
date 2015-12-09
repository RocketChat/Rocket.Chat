Package.describe({
	name: 'rocketchat:importer-slack',
	version: '0.0.1',
	summary: 'Importer for Slack',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use([
		'coffeescript',
		'check',
		'rocketchat:lib@0.0.1',
		'rocketchat:importer@0.0.1'
	]);

	api.addFiles('main.coffee');
});

Package.onTest(function(api) {
});

Npm.depends({
	"adm-zip": "0.4.7"
});
