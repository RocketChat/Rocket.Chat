Package.describe({
	name: 'rocketchat:login-token',
	summary: '',
	version: '1.0.0',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'accounts-base',
		'kadira:flow-router',
		'kadira:blaze-layout',
		'rocketchat:lib',
		'rocketchat:logger',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
