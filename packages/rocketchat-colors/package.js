Package.describe({
	name: 'rocketchat:colors',
	version: '0.0.1',
	summary: 'Message pre-processor that will process colors',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'coffeescript',
		'rocketchat:lib'
	]);

	api.addFiles('client.coffee', 'client');
	api.addFiles('style.css', 'client');
});
