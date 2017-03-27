/* globals Package */
Package.describe({
	name: 'rocketchat:file-upload',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: null
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:file');
	api.use('jalik:ufs');
	api.use('jalik:ufs-local@0.2.5');
	api.use('edgee:slingshot');
	api.use('ostrio:cookies');
	api.use('peerlibrary:aws-sdk');
	api.use('rocketchat:lib');
	api.use('random');
	api.use('underscore');
	api.use('tracker');
	api.use('webapp');

	api.addFiles('globalFileRestrictions.js');

	// commom lib
	api.addFiles('lib/FileUpload.js');
	api.addFiles('lib/FileUploadBase.js');

	api.addFiles('client/lib/FileUploadAmazonS3.js', 'client');
	api.addFiles('client/lib/FileUploadFileSystem.js', 'client');
	api.addFiles('client/lib/FileUploadGoogleStorage.js', 'client');
	api.addFiles('client/lib/FileUploadGridFS.js', 'client');
	api.addFiles('client/lib/fileUploadHandler.js', 'client');

	api.addFiles('server/lib/FileUpload.js', 'server');
	api.addFiles('server/lib/requests.js', 'server');

	api.addFiles('server/config/configFileUploadAmazonS3.js', 'server');
	api.addFiles('server/config/configFileUploadFileSystem.js', 'server');
	api.addFiles('server/config/configFileUploadGoogleStorage.js', 'server');
	api.addFiles('server/config/configFileUploadGridFS.js', 'server');

	api.addFiles('server/methods/sendFileMessage.js', 'server');
	api.addFiles('server/methods/getS3FileUrl.js', 'server');

	api.addFiles('server/startup/settings.js', 'server');

	api.export('fileUploadHandler');
	api.export('FileUpload');
});

Npm.depends({
	'filesize': '3.3.0'
});
