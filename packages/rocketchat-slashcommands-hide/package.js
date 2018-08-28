Package.describe({
	name: 'rocketchat:slashcommands-hide',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /hide commands',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
	]);

	api.addFiles('client/hide.js', 'client');
	api.addFiles('server/hide.js', 'server');
});
