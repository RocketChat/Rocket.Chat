Package.describe({
	name: 'rocketchat:slashcommands-me',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /me commands',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib'
	]);

	api.addFiles('me.js', 'server');
});
