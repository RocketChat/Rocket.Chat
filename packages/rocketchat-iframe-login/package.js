Package.describe({
	name: 'rocketchat:iframe-login',
	summary: '',
	version: '1.0.0',
});

Package.onUse(function(api) {
	api.use([
		'rocketchat:logger',
		'kadira:flow-router',
		'rocketchat:lib',
		'rocketchat:ui-utils',
		'accounts-base',
		'ecmascript',
		'reactive-var',
		'http',
		'tracker',
		'check',
	]);
	api.imply([
		'facebook-oauth',
		'twitter-oauth',
		'google-oauth',
		'oauth',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
