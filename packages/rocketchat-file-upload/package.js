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
	api.use('jalik:ufs-gridfs');
	api.use('jalik:ufs-local@0.2.5');
	api.use('edgee:slingshot');
	api.use('ostrio:cookies');
	api.use('rocketchat:lib');
	api.use('random');
	api.use('accounts-base');
	api.use('tracker');
	api.use('webapp');

	api.addFiles('globalFileRestrictions.js');

	// commom lib
	api.addFiles('lib/FileUpload.js');
	api.addFiles('lib/FileUploadBase.js');

	api.addFiles('client/lib/fileUploadHandler.js', 'client');

	api.addFiles('server/lib/FileUpload.js', 'server');
	api.addFiles('server/lib/proxy.js', 'server');
	api.addFiles('server/lib/requests.js', 'server');

	api.addFiles('server/config/_configUploadStorage.js', 'server');

	api.addFiles('server/methods/sendFileMessage.js', 'server');
	api.addFiles('server/methods/getS3FileUrl.js', 'server');

	api.addFiles('server/startup/settings.js', 'server');

	api.export('fileUploadHandler');
	api.export('FileUpload');
});

Npm.depends({
	'filesize': '3.3.0'
});
