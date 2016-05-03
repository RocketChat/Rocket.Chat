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
	api.versionsFrom('1.2.1');
	api.use([
		'ecmascript',
		'templating',
		'coffeescript',
		'underscore',
		'rocketchat:lib'
	]);

	api.use('kadira:flow-router', 'client');

	api.addFiles('routes.js', 'client');

	api.addFiles('reset-password/resetPassword.html', 'client');
	api.addFiles('reset-password/resetPassword.js', 'client');

	api.addFiles('login/footer.html', 'client');
	api.addFiles('login/form.html', 'client');
	api.addFiles('login/header.html', 'client');
	api.addFiles('login/layout.html', 'client');
	api.addFiles('login/layout.js', 'client');
	api.addFiles('login/services.html', 'client');
	api.addFiles('login/social.html', 'client');

	api.addFiles('username/layout.html', 'client');
	api.addFiles('username/username.html', 'client');

	api.addFiles('login/footer.coffee', 'client');
	api.addFiles('login/form.coffee', 'client');
	api.addFiles('login/header.coffee', 'client');
	api.addFiles('login/services.coffee', 'client');
	api.addFiles('login/social.coffee', 'client');
	api.addFiles('username/username.coffee', 'client');
});
