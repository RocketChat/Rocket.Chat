Package.describe({
	name: 'rocketchat:ldap',
	version: '0.0.1',
	summary: 'Accounts login handler for LDAP using ldapjs from npm',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'underscore',
		'sha',
		'rocketchat:logger',
		'rocketchat:lib',
		'yasaricli:slugify',
		'templating',
		'accounts-base',
		'accounts-password',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
