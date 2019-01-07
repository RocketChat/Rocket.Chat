Package.describe({
	name: 'rocketchat:cas',
	summary: 'CAS support for accounts',
	version: '1.0.0',
	git: 'https://github.com/rocketchat/rocketchat-cas',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:logger',
		'service-configuration',
		'routepolicy',
		'webapp',
		'accounts-base',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
