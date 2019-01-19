Package.describe({
	name: 'rocketchat:lazy-load',
	version: '0.0.1',
	summary: 'Lazy load image',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
	]);

	api.mainModule('client/index.js', 'client');
});
