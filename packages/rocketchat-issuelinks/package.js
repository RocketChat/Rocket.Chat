Package.describe({
	name: 'rocketchat:issuelinks',
	version: '0.0.1',
	summary: 'Message pre-processor that adds links to issue numbers.',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('ecmascript');

	api.addFiles('client.js', ['client']);
	api.addFiles('settings.js', ['server']);
});
