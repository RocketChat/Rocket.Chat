Package.describe({
	name: 'rocketchat:highlight',
	version: '0.0.1',
	summary: 'Message pre-processor that will highlight code syntax',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'simple:highlight.js',
		'rocketchat:lib'
	]);

	api.addFiles('highlight.coffee', ['server','client']);
});
