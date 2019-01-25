Package.describe({
	name: 'rocketchat:tooltip',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
	]);
	api.addFiles('client/tooltip.css', 'client');
	api.mainModule('client/index.js', 'client');
});
