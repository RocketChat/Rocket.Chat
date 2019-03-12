Package.describe({
	name: 'rocketchat:message-mark-as-unread',
	version: '0.0.1',
	summary: 'Mark a message as unread',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:logger',
		'rocketchat:models',
		'rocketchat:ui-utils',
		'rocketchat:utils',
		'templating',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
