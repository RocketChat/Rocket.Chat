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
		'rocketchat:lib'
	]);

	api.addFiles('lib/client/widget.coffee', 'client');
	api.addFiles('lib/client/oembedSpotifyWidget.html', 'client');

	api.addFiles('lib/spotify.coffee', ['server','client']);
});
