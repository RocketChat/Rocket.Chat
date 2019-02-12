Package.describe({
	name: 'rocketchat:videobridge',
	version: '0.2.0',
	summary: 'jitsi integration',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'less',
		'rocketchat:utils',
		'rocketchat:lib',
		'rocketchat:bigbluebutton',
		'templating',
	]);
	api.addAssets('client/public/external_api.js', 'client');
	api.addFiles('client/stylesheets/video.less', 'client');
	api.addFiles('server/settings.js', 'server');
	api.addFiles('server/models/Rooms.js', 'server');
	api.addFiles('server/methods/jitsiSetTimeout.js', 'server');
	api.addFiles('server/methods/jitsiGenerateToken.js', 'server');
	api.addFiles('server/methods/bbb.js', 'server');
	api.addFiles('server/actionLink.js', 'server');

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
