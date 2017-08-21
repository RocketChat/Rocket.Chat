Package.describe({
	name: 'rocketchat:markdown',
	version: '0.0.1',
	summary: 'Message pre-processor that will process selected markdown notations',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'underscore',
		'templating',
		'underscorestring:underscore.string',
		'rocketchat:lib'
	]);

	api.addFiles('settings.js', 'server');
	api.addFiles('markdown.js');
	api.addFiles('markdowncode.js');
});
