Package.describe({
	name: 'rocketchat:file-upload',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: null,
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:file',
		'jalik:ufs',
		'jalik:ufs-gridfs',
		'jalik:ufs-local@0.2.5',
		'edgee:slingshot',
		'ostrio:cookies',
		'rocketchat:models',
		'rocketchat:utils',
		'rocketchat:settings',
		'rocketchat:callbacks',
		'rocketchat:authorization',
		'rocketchat:logger',
		'random',
		'accounts-base',
		'tracker',
		'webapp',
		'konecty:multiple-instances-status',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
