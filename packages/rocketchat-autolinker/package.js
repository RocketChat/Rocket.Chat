Package.describe({
	name: 'rocketchat:autolinker',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate links on messages',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'coffeescript',
		'rocketchat:lib'
	]);

	api.addFiles([
		'client.coffee',
		'lib/Autolinker.min.js'
	], ['client']);

	api.addFiles('settings.coffee', ['server']);
});
