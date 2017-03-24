Package.describe({
	name: 'rocketchat:2fa',
	version: '0.0.1',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Npm.depends({
	speakeasy: '2.0.0'
});

Package.onUse(function(api) {
	// api.versionsFrom('1.4.3.1');
	// api.use('ecmascript');
	// api.mainModule('rocketchat-2fa.js');

	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib'
	]);
	api.addFiles('client/accountSecurity.html', 'client');
	api.addFiles('client/accountSecurity.js', 'client');
	api.addFiles('client/TOTPPassword.js', 'client');

	// api.addFiles('server/methods/enable2fa.js', 'server');
});
