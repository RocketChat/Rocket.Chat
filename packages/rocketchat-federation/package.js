Package.describe({
	name: 'rocketchat:federation',
	version: '0.0.1',
	summary: 'RocketChat support for federating with other RocketChat servers',
	git: '',
});

Package.onUse(function(api) {
	api.use(['ecmascript', 'underscore', 'rocketchat:lib']);

	api.use('accounts-base', 'server');
	api.use('accounts-password', 'server');

	api.addFiles('server/federation.js', 'server');
	api.addFiles('server/federation-settings.js', 'server');
});

Npm.depends({
	express: '4.16.3',
	'body-parser': '1.18.3',
});
