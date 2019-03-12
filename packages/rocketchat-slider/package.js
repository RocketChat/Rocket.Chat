Package.describe({
	name: 'rocketchat:slider',
	version: '0.0.1',
	summary: 'UI slider component for input range.',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:theme',
	]);
	api.mainModule('client/index.js', 'client');
});
