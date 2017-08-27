Package.describe({
	name: 'rocketchat:idle-watcher',
	version: '0.0.1',
	summary: 'Watchers for idle presence of the current user.',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'webapp'
	]);
});
