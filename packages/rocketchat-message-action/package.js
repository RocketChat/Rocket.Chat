Package.describe({
	name: 'rocketchat:message-action',
	version: '0.0.1',
	summary: 'Widget for message action',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'templating',
		'ecmascript',
		'rocketchat:lib',
	]);

	api.addFiles('client/messageAction.html', 'client');
	api.addFiles('client/messageAction.js', 'client');

	// stylesheets
	api.addFiles('client/stylesheets/messageAction.css', 'client');
});
