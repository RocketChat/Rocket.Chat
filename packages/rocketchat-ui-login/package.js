Package.describe({
	name: 'rocketchat:ui-login',
	version: '0.1.0',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:assets',
		'rocketchat:2fa',
		'rocketchat:ui'
	]);

	api.use('kadira:flow-router', 'client');

	api.addFiles('client/routes.js', 'client');

	api.addFiles('client/reset-password/resetPassword.html', 'client');
	api.addFiles('client/reset-password/resetPassword.js', 'client');

	api.addFiles('client/login/footer.html', 'client');
	api.addFiles('client/login/form.html', 'client');
	api.addFiles('client/login/header.html', 'client');
	api.addFiles('client/login/layout.html', 'client');
	api.addFiles('client/login/layout.js', 'client');
	api.addFiles('client/login/services.html', 'client');
	api.addFiles('client/login/social.html', 'client');
	api.addFiles('client/login/globalAnnouncement.html', 'client');
	api.addFiles('client/login/globalAnnouncement.js', 'client');

	api.addFiles('client/username/layout.html', 'client');
	api.addFiles('client/username/username.html', 'client');

	api.addFiles('client/login/footer.js', 'client');
	api.addFiles('client/login/form.js', 'client');
	api.addFiles('client/login/header.js', 'client');
	api.addFiles('client/login/services.js', 'client');
	api.addFiles('client/login/social.js', 'client');
	api.addFiles('client/username/username.js', 'client');
});
