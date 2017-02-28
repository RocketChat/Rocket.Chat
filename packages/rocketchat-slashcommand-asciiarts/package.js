Package.describe({
	name: 'rocketchat:slashcommands-asciiarts',
	version: '0.0.1',
	summary: 'Message pre-processor that will add ascii arts to messages',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'rocketchat:lib'
	]);

	api.use('ecmascript');

	api.addFiles('gimme.js', ['server', 'client']);
	api.addFiles('lenny.js', ['server', 'client']);
	api.addFiles('shrug.js', ['server', 'client']);
	api.addFiles('tableflip.js', ['server', 'client']);
	api.addFiles('unflip.js', ['server', 'client']);
});
