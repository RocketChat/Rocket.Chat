Package.describe({
	name: 'assistify',
	version: '0.0.1',
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.4.2.6');
	api.use('ecmascript');
	api.use('templating', 'client'); //needed in order to be able to register global helpers on the Template-object
	api.mainModule('assistify.js');

	//Server
	api.addFiles('config.js', 'server');
	//TODO add jquery?

	//Client
	api.addFiles('client/lib/globalTemplateHelpers.js', 'client');

	//i18n in Rocket.Chat-package (packages/rocketchat-i18n/i18n)
});
