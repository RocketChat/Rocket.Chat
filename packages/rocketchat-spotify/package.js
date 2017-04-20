Package.describe({
	name: 'rocketchat:spotify',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate spotify on messages',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'underscore',
		'rocketchat:oembed',
		'rocketchat:lib'
	]);

	api.addFiles('lib/client/widget.js', 'client');
	api.addFiles('lib/client/oembedSpotifyWidget.html', 'client');

	api.addFiles('lib/spotify.js', ['server', 'client']);
});
