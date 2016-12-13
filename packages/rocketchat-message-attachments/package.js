Package.describe({
	name: 'rocketchat:message-attachments',
	version: '0.0.1',
	summary: 'Widget for message attachments',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'templating',
		'ecmascript',
		'coffeescript',
		'underscore',
		'rocketchat:lib'
	]);

	api.addFiles('client/messageAttachment.html', 'client');
	api.addFiles('client/messageAttachment.coffee', 'client');

	// stylesheets
	api.addAssets('client/stylesheets/messageAttachments.less', 'server');
	api.addFiles('client/stylesheets/loader.coffee', 'server');
});
