Package.describe({
	name: 'rocketchat:setup-wizard',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('templating', 'client');
	api.use('rocketchat:theme');

	api.addFiles('client/setupWizard.html', 'client');
	api.addFiles('client/setupWizard.js', 'client');

	api.addFiles('server/lib/getWizardSettings.js', 'server');
});
