Package.describe({
	name: 'rocketchat:file',
	version: '0.0.1',
	summary: '',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
	]);
	api.mainModule('server/index.js', 'server');
});
