Package.describe({
	name: 'rocketchat:cas',
	summary: 'CAS support for accounts',
	version: '1.0.0',
	git: 'https://github.com/rocketchat/rocketchat-cas'
});

Package.onUse(function(api) {
	// Server libs
	api.use('rocketchat:lib', 'server');
	api.use('rocketchat:logger', 'server');
	api.use('service-configuration', 'server');
	api.use('routepolicy', 'server');
	api.use('webapp', 'server');
	api.use('accounts-base', 'server');

	api.use('ecmascript');

	// Server files
	api.add_files('server/cas_rocketchat.js', 'server');
	api.add_files('server/cas_server.js', 'server');
	api.add_files('server/models/CredentialTokens.js', 'server');

	// Client files
	api.add_files('client/cas_client.js', 'client');
});

Npm.depends({
	cas: 'https://github.com/kcbanner/node-cas/tarball/fcd27dad333223b3b75a048bce27973fb3ca0f62'
});
