Package.describe({
	name: 'rocketchat:colors',
	version: '0.0.1',
	summary: 'Message pre-processor that will process colors',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'rocketchat:lib'
	]);
	api.addFiles('client.js', ['client']);
	api.addFiles('style.css', ['client']);
	api.addFiles('settings.js', ['server']);
});
