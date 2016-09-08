Package.describe({
	name: 'rocketchat:mapview',
	version: '0.0.1',
	summary: 'Message pre-processor that will replace geolocation in messages with a Google Static Map'
});

Package.onUse(function(api) {
	api.use([
		'coffeescript',
		'rocketchat:lib'
	]);

	api.addFiles('server/settings.coffee', 'server');

	api.addFiles('client/mapview.coffee', 'client');

});
