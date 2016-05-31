Package.describe({
	name: 'rocketchat:slashcommands-unflip',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /unflip commands',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'rocketchat:lib'
	]);

	api.use('ecmascript');

	api.addFiles('unflip.js', ['server', 'client']);
});
