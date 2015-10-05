Package.describe({
	name: 'rocketchat:spotify',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate spotify on messages',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'templating',
		'underscore',
		'rocketchat:oembed@0.0.1',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('client/widget.coffee', 'client');
	api.addFiles('client/oembedSpotifyWidget.html', 'client');

	api.addFiles('spotify.coffee', ['server','client']);
});

Package.onTest(function(api) {

});
