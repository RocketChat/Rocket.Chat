Package.describe({
	name: 'rocketchat:oembed',
	version: '0.0.1',
	summary: 'Message pre-processor that insert oEmbed widget in template',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'http',
		'templating',
		'ecmascript',
		'konecty:change-case',
		'rocketchat:lib',
		'rocketchat:utils',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
