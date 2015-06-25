Package.describe({
	name: 'rocketchat:oembed',
	version: '0.0.1',
	summary: 'Message pre-processor that insert oEmbed widget in template',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'iframely:oembed',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('server.coffee', ['server']);
	api.export('OEmbed', ['server']);
});

Package.onTest(function(api) {

});
