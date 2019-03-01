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
	]);
	api.addFiles('client/stylesheets/messageAction.css', 'client');
	api.mainModule('client/index.js', 'client');
});
