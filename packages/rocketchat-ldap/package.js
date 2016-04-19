Package.describe({
	name: 'rocketchat:ldap',
	version: '0.0.1',
	summary: 'Accounts login handler for LDAP using ldapjs from npm',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('rocketchat:ldapjs');
	api.use('rocketchat:logger');
	api.use('rocketchat:lib');
	api.use('yasaricli:slugify');
	api.use('ecmascript');
	api.use('sha');

	api.use('templating', 'client');

	api.use('accounts-base', 'server');
	api.use('accounts-password', 'server');

	api.addFiles('client/loginHelper.js', 'client');

	api.addFiles('server/ldap.js', 'server');
	api.addFiles('server/sync.js', 'server');
	api.addFiles('server/loginHandler.js', 'server');
	api.addFiles('server/settings.js', 'server');
	api.addFiles('server/testConnection.js', 'server');
	api.addFiles('server/syncUsers.js', 'server');

	api.export('LDAP', 'server');
});
