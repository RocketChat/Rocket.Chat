Package.describe({
	name: 'rocketchat:federation',
	version: '0.0.1',
	summary: 'RocketChat support for federating with other RocketChat servers',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'underscore',
		'rocketchat:api',
		'rocketchat:lib',
		'rocketchat:reactions',
		'rocketchat:models',
		'rocketchat:settings',
	]);

	api.use('accounts-base', 'server');
	api.use('accounts-password', 'server');

	// Add models
	api.addFiles('server/models/FederationDNSCache.js', 'server');
	api.addFiles('server/models/FederationEvents.js', 'server');
	api.addFiles('server/models/FederationKeys.js', 'server');

	// Add methods
	api.addFiles('server/methods/index.js', 'server');

	// Add core files
	api.addFiles('server/federation.js', 'server');
	api.addFiles('server/federation-settings.js', 'server');
});

Npm.depends({
	'queue-fifo': '0.2.5',
	'node-rsa': '1.0.2',
});
