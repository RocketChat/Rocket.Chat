Package.describe({
	name: 'rocketchat:mapview',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate geolocation to maps on messages',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib'
	]);

	api.addFiles([
		'mapview.coffee'
	], ['client']);
	
	api.addFiles('settings.coffee', 'server');
	
});
