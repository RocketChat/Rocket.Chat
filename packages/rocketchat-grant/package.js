Package.describe({
	name: 'rocketchat:grant',
	version: '0.0.1',
	summary: 'OAuth2',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'webapp',
		'mongo',
		'check',
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:accounts',
	]);

	api.mainModule('server/index.js', 'server');
});

Npm.depends({
	express: '4.15.3',
	'express-session': '1.15.4',
	'grant-express': '3.8.0',
	'connect-mongodb-session': '2.0.6'
});
