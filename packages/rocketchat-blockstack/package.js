Package.describe({
	name: 'rocketchat:blockstack',
	version: '0.0.0',
	summary: 'Auth handler and utilities for Blockstack',
	git: ''
});

Package.onUse((api) => {

	api.use([
		'modules',
		'ecmascript',
		'localstorage',
		'session',
		'url',
		'http',
		'accounts-base',
		'service-configuration'
	]);

	api.use([
		'rocketchat:lib',
		'rocketchat:logger',
		'meteorhacks:picker',
		'routepolicy',
		'webapp'
	], 'server');

	api.use([
		'aldeed:template-extension@4.1.0',
		'kadira:flow-router',
		'templating',
		'less',
		'reload'
	], 'client');

	api.addAssets([
		'assets/blockstack_mark.png'
	], 'client');

	api.addFiles([
		'server/main.js',
		'server/routes.js',
		'server/settings.js',
		'server/tokenHandler.js',
		'server/userHandler.js',
		'server/loginHandler.js',
		'server/logoutHandler.js'
	], 'server');

	api.addFiles([
		'client/main.js',
		'client/routes.js',
		'client/stylesheets/blockstackLogin.less',
		'client/views/login.html',
		'client/views/login.js',
		'client/views/noServices.html',
		'client/views/noServices.js'
	], 'client');

});
