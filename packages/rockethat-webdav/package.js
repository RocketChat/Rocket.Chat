Package.describe({
	name: 'rocketchat:webdav',
	version: '0.0.1',

	summary: 'Package for RocketChat users to interact with WebDAV servers.',

	git: '',

	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('mongo');
	api.use('rocketchat:lib');
	api.use('rocketchat:api');
	api.use('rocketchat:grant');

	api.addFiles('startup/messageBoxActions.js', 'client');
});
