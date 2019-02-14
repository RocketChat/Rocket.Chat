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
		'rocketchat:api',
		'rocketchat:bigbluebutton',
		'templating',
	]);
	api.addAssets('client/public/external_api.js', 'client');
	api.addFiles('client/stylesheets/video.less', 'client');

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
