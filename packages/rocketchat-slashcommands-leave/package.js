Package.describe({
	name: 'rocketchat:slashcommands-leave',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /leave commands',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib'
	]);

	api.addFiles('leave.js', 'server');
});
