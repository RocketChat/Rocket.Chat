Package.describe({
	name: 'rocketchat:2fa',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use([
		'accounts-base',
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:custom-oauth',
		'pauli:accounts-linkedin',
		'sha',
		'random'
	]);

	api.addFiles('client/lib/2fa.js', 'client');

	api.addFiles('client/accountSecurity.html', 'client');
	api.addFiles('client/accountSecurity.js', 'client');
	api.addFiles('client/TOTPPassword.js', 'client');
	api.addFiles('client/TOTPOAuth.js', 'client');
	api.addFiles('client/TOTPGoogle.js', 'client');

	api.addFiles('server/lib/totp.js', 'server');

	api.addFiles('server/methods/checkCodesRemaining.js', 'server');
	api.addFiles('server/methods/disable.js', 'server');
	api.addFiles('server/methods/enable.js', 'server');
	api.addFiles('server/methods/regenerateCodes.js', 'server');
	api.addFiles('server/methods/validateTempToken.js', 'server');

	api.addFiles('server/models/users.js', 'server');

	api.addFiles('server/loginHandler.js', 'server');
});
