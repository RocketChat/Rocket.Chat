Package.describe({
	name: 'rocketchat:soundcloud',
	version: '0.0.1',
	summary: 'Soundcloud integration',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'templating',
		'rocketchat:oembed@0.0.1'
	]);

	api.addFiles('lib/client/widget.coffee', 'client');
	api.addFiles('lib/client/oembedSoundcloudWidget.html', 'client');
});

Package.onTest(function(api) {

});
