Package.describe({
	name: 'voismart:ngapi',
	version: '0.0.1',
	summary: 'Orchestra NG API module',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'http'
	]);

	api.addFiles([
		'server.coffee'
	], ['server']);

});
