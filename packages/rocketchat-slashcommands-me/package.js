Package.describe({
	name: 'rocketchat:slashcommands-me',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /me commands',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:utils',
	]);
	api.mainModule('server/index.js', 'server');
});
