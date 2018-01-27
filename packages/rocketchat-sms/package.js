Package.describe({
	name: 'rocketchat:sms',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:lib');

	api.addFiles('settings.js', 'server');
	api.addFiles('SMS.js', 'server');
	api.addFiles('services/twilio.js', 'server');
});
