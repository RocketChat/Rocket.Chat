Package.describe({
	name: 'rocketchat:ui-account',
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
		'coffeescript',
		'underscore',
		'rocketchat:lib',
		'sha'
	]);

	api.addFiles('client/account.html', 'client');
	api.addFiles('client/accountFlex.html', 'client');
	api.addFiles('client/accountPreferences.html', 'client');
	api.addFiles('client/accountProfile.html', 'client');
	api.addFiles('client/avatar/avatar.html', 'client');
	api.addFiles('client/avatar/prompt.html', 'client');

	api.addFiles('client/account.coffee', 'client');
	api.addFiles('client/accountFlex.coffee', 'client');
	api.addFiles('client/accountPreferences.coffee', 'client');
	api.addFiles('client/accountProfile.coffee', 'client');
	api.addFiles('client/avatar/avatar.coffee', 'client');
	api.addFiles('client/avatar/prompt.coffee', 'client');

	// api.addAssets('styles/side-nav.less', 'client');
});
