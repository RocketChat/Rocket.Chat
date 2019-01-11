Package.describe({
	name: 'rocketchat:ui-utils',
	version: '0.0.1',
	summary: 'Rocketchat Ui Utils',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:utils',
	]);
	api.mainModule('client/index.js', 'client');
});
