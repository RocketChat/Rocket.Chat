Package.describe({
	name: 'rocketchat:slashcommands-tableflip',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /tableflip and /unflip commands',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'rocketchat:lib'
	]);

	api.use('ecmascript');

	api.addFiles('tableflip.js', ['server', 'client']);
	api.addFiles('unflip.js', ['server', 'client']);
});
