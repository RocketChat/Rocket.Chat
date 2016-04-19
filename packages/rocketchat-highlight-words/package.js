Package.describe({
	name: 'rocketchat:highlight-words',
	version: '0.0.1',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');

	api.use([
		'coffeescript',
		'rocketchat:lib'
	]);

	api.addFiles('client.coffee', 'client');
});
