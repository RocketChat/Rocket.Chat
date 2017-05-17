Package.describe({
	name: 'voismart:webc',
	version: '0.0.1',
	summary: 'VoiSmart WebCollaboration Integration'
});

Package.onUse(function (api) {
	api.versionsFrom('1.0');

	api.use([
		'ecmascript',
		'coffeescript',
		'templating',
		'underscore',
		'random',
		'less@2.5.0',
		'rocketchat:lib',
	]);

	api.use('templating', 'client');

	var flatpickrDir = '.npm/package/node_modules/flatpickr/dist';
	api.addFiles([
		// including flatpickr css here because
		// seems a bit cumbersome to import on less side
		flatpickrDir + '/flatpickr.min.css',
		flatpickrDir + '/themes/airbnb.css',
		flatpickrDir + '/plugins/confirmDate/confirmDate.css',
		// our stuff
		'client/views/webCollaboration.less',
		'client/views/webCollaboration.html',
		'client/flatpickr-bridge.js',
		'client/tabBar.coffee',
		'client/actionLink.coffee',
		'client/messageType.coffee'
	], 'client');

	api.addFiles([
		'server/settings.coffee',
		'server/methods/webcRequest.coffee',
		'server/methods/phoneNumberOffer.coffee',
		'server/methods/webcEmailRequest.coffee',
		'server/actionLink.coffee'
	], 'server');
});

Npm.depends({
	"flatpickr": "2.6.1",
});
