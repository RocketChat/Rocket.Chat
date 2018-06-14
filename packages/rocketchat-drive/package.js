Package.describe({
	name: 'rocketchat:drive',
	version: '0.0.1',

	summary: '',

	git: '',

	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('mongo');
	api.use('rocketchat:lib');
	api.use('rocketchat:api');
	api.use('rocketchat:grant');

	api.use('templating', 'client');

	api.addFiles('server/checkDriveAccess.js', 'server');
	api.addFiles('server/createGoogleFile.js', 'server');
	api.addFiles('server/uploadFileToDrive.js', 'server');
	api.addFiles('client/actionButton.js', 'client');
	api.addFiles('client/messageBoxActions.js', 'client');
});
