Package.describe({
	name: 'voismart:webc',
	version: '0.0.1',
	summary: 'VoiSmart WebCollaboration Integration'
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
            'client/views/webCollaboration.html',
            'client/tabBar.coffee'
    ], 'client');

	api.addFiles([
            'server/settings.coffee',
            'server/methods/webcRequest.coffee'
    ], 'server');
});
