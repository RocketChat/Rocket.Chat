Package.describe({
	name: 'assistify:bot',
	version: '0.0.1',
	// Brief, one-line summary of the package.
	summary: 'Adds a bot which propagates AI-results',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.4.2.6');
	api.use('ecmascript');
	api.use('assistify:help-request');
	api.mainModule('bot.js');
});
