Package.describe({
	name: 'rocketchat:drive-upload',
	version: '0.0.1',

	summary: 'Upload files to Google Drive',

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

	api.addFiles('server/drive-upload.js', 'server');
	api.addFiles('client/actionButton.js', 'client');
});
