Package.describe({
	name: 'rocketchat:accounts',
	version: '0.0.1',
	summary: 'JS-Accounts integration',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'underscore',
		'ecmascript'
	]);

	api.use('mongo', ['client', 'server']);

	api.mainModule('server/index.js', 'server');
});

Npm.depends({
	'@accounts/server': '0.0.17',
	'@accounts/mongo': '0.0.12-0',
	'@accounts/meteor-adapter': '0.1.1'
});
