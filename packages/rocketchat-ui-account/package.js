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
	api.versionsFrom('1.2.1');

	api.use([
		'ecmascript',
		'templating',
		'coffeescript',
		'underscore',
		'rocketchat:lib',
		'sha'
	]);

	api.addFiles('account/account.html', 'client');
	api.addFiles('account/accountFlex.html', 'client');
	api.addFiles('account/accountPreferences.html', 'client');
	api.addFiles('account/accountProfile.html', 'client');
	api.addFiles('account/avatar/avatar.html', 'client');
	api.addFiles('account/avatar/prompt.html', 'client');

	api.addFiles('account/account.coffee', 'client');
	api.addFiles('account/accountFlex.coffee', 'client');
	api.addFiles('account/accountPreferences.coffee', 'client');
	api.addFiles('account/accountProfile.coffee', 'client');
	api.addFiles('account/avatar/avatar.coffee', 'client');
	api.addFiles('account/avatar/prompt.coffee', 'client');

	// api.addAssets('styles/side-nav.less', 'client');
});
