Package.describe({
	name: 'rocketchat:videobridge',
	version: '0.2.0',
	summary: 'jitsi integration',
	git: '',
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'ecmascript',
		'underscore',
		'less@2.5.0',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addAssets('client/public/external_api.js', 'client');

	api.addFiles('client/stylesheets/video.less', 'client');
	api.addFiles('client/views/videoFlexTab.html', 'client');
	api.addFiles('client/views/videoFlexTab.js', 'client');
	api.addFiles('client/tabBar.js', 'client');
	api.addFiles('client/actionLink.js', 'client');
	api.addFiles('client/messageType.js', 'client');

	api.addFiles('server/settings.js', 'server');
	api.addFiles('server/models/Rooms.js', 'server');
	api.addFiles('server/methods/jitsiSetTimeout.js', 'server');
	api.addFiles('server/actionLink.js', 'server');

});
