Package.describe({
	name: 'rocketchat:ldap',
	version: '0.0.1',
	summary: 'Accounts login handler for LDAP using ldapjs from npm',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:logger');
	api.use('rocketchat:lib');
	api.use('yasaricli:slugify');
	api.use('ecmascript');
	api.use('sha');

	api.use('templating', 'client');

	api.use('accounts-base', 'server');
	api.use('accounts-password', 'server');

	api.addFiles('client/loginHelper.js', 'client');

	api.mainModule('server/index.js', 'server');
});
