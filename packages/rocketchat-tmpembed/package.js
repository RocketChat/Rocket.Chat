Package.describe({
	name: 'rocketchat:tmpembed',
	version: '0.0.1',
	summary: 'Message pre-processor that handles embedding of images and maps',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('tmpembed.coffee', ['server','client']);
});

Package.onTest(function(api) {

});
