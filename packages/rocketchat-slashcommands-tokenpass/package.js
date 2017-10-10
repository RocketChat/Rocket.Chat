Package.describe({
	name: 'rocketchat:slashcommands-tokenpass',
	version: '0.0.1',
	summary: 'Commands handler for Token Controlled Access Channels with Tokenpass',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib',
		'rocketchat:tokenpass'
	]);

	api.use('templating', 'client');

	api.addFiles('client/tokenpass-add-address.js', 'client');
	api.addFiles('client/tokenpass-inventory.js', 'client');
	api.addFiles('client/tokenpass-lend.js', 'client');
	api.addFiles('client/tokenpass-register.js', 'client');
	api.addFiles('client/tokenpass-verify-address.js', 'client');

	api.addFiles('server/tokenpass-add-address.js', 'server');
	api.addFiles('server/tokenpass-inventory.js', 'server');
	api.addFiles('server/tokenpass-lend.js', 'server');
	api.addFiles('server/tokenpass-register.js', 'server');
	api.addFiles('server/tokenpass-verify-address.js', 'server');
});

Npm.depends({
	'crypto': '1.0.1'
});
