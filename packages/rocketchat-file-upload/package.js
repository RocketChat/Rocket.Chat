Package.describe({
	name: 'rocketchat:file-upload',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: null
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');
	api.use('ecmascript');
	api.use('edgee:slingshot');
	api.use('rocketchat:lib');
	api.use('random');
	api.use('underscore');
	api.use('webapp');

	api.addFiles('globalFileRestrictions.js');

	api.addFiles('client/lib/FileUploadBase.js', 'client');

	api.addFiles('client/lib/FileUploadS3.js', 'client');
	api.addFiles('client/lib/FileUploadGridFS.js', 'client');

	api.addFiles('client/lib/fileUploadHandler.js', 'client');

	api.addFiles('server/lib/fileUploadResponse.js', 'server');
	api.addFiles('server/lib/requests.js', 'server');
	api.addFiles('server/lib/responseGridFS.js', 'server');
	api.addFiles('server/lib/responseS3.js', 'server');

	api.addFiles('server/configS3.js', 'server');
	api.addFiles('server/startup/settings.js', 'server');

	api.addFiles('server/methods/sendFileMessage.js', 'server');

	api.export('fileUploadHandler');
});
