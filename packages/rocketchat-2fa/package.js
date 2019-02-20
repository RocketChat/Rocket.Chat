Package.describe({
	name: 'rocketchat:2fa',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'accounts-base',
		'ecmascript',
		'templating',
		'rocketchat:settings',
		'sha',
		'random',
		'rocketchat:ui-utils',
		'rocketchat:utils',
		'rocketchat:models',
		'rocketchat:callbacks',
		'rocketchat:ldap',
		'rocketchat:custom-oauth',
		'pauli:accounts-linkedin',
		'steffo:meteor-accounts-saml',
	]);

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
