Package.describe({
	name: 'steffo:meteor-accounts-saml',
	summary: 'SAML Login (SP) for Meteor. Works with OpenAM, OpenIDP and provides Single Logout.',
	version: '0.0.1',
	git: 'https://github.com/steffow/meteor-accounts-saml.git',
});

Package.on_use(function(api) {
	api.use([
		'ecmascript',
		'http',
		'accounts-base',
	]);
	api.use([
		'routepolicy',
		'webapp',
		'rocketchat:lib',
		'rocketchat:models',
		'service-configuration',
	], 'server');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
