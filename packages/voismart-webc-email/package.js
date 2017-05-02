Package.describe({
	name: 'voismart:webc-email',
	version: '0.0.1',
	summary: 'VoiSmart WebCollaboration Integration by Email'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
			'coffeescript',
			'underscore',
			'random',
			'less@2.5.0',
			'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles([
			'client/views/webCollaboration.less',
			'client/views/webCollaborationEmail.html',
			'client/tabBar.coffee'
    ], 'client');

	api.addFiles([
			'server/methods/webcEmailRequest.coffee'
    ], 'server');
});
