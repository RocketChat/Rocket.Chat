Package.describe({
	name: 'rocketchat:mapview',
	version: '0.0.1',
	summary: 'Message pre-processor that will replace geolocation in messages with a Google Static Map',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'tap:i18n',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
