Package.describe({
	name: 'rocketchat:message-attachments',
	version: '0.0.1',
	summary: 'Widget for message attachments',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'templating',
		'coffeescript',
		'underscore',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('client/messageAttachment.html', 'client');

	// stylesheets
	api.addAssets('client/stylesheets/messageAttachments.less', 'server');
	api.addFiles('client/stylesheets/loader.coffee', 'server');
});

Package.onTest(function(api) {

});
