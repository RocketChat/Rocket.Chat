Package.describe({
	name: 'rocketchat:emojione',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate emojis',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'emojione:emojione',
		'rocketchat:lib'
	]);

	api.addFiles('emojione.coffee', ['server','client']);
	api.addFiles('rocketchat.coffee', 'client');
});

Package.onTest(function(api) {

});
