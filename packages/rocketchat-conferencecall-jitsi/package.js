Package.describe({
	name: 'rocketchat:conferencecall-jitsi',
	version: '0.2.0',
	summary: 'jitsi integration',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'modules',
		'underscore',
		'less',
		'rocketchat:lib',
		'rocketchat:conferencecall'
	]);

	api.use('templating', 'client');

	api.addAssets('client/public/external_api.js', 'client');

	api.addFiles('client/stylesheets/video.less', 'client');
	api.addFiles('client/views/jitsiVideoTab.html', 'client');
	api.addFiles('client/views/jitsiVideoTab.js', 'client');

	api.addFiles('common/conferenceCallProvider.js', ['client', 'server']);

	api.addFiles('server/settings.js', 'server');
	api.addFiles('server/models/Rooms.js', 'server');
	api.addFiles('server/methods/jitsiSetTimeout.js', 'server');
});
