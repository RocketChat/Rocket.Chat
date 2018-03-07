Package.describe({
	name: 'rocketchat:search',
	version: '0.0.1',
	summary: 'Rocketchat Search Providers',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:logger',
		'kadira:flow-router'
	]);

	api.addFiles([
		'client/search/search.html',
		'client/search/search.js',
		'client/provider/result.html',
		'client/provider/result.js',
		'client/style/style.css'
	], 'client');

	api.addFiles([
		'server/model/provider.js',
		'server/service/providerService.js',
		'server/service/validationService.js',
		'server/events/events.js',
		'server/provider/defaultProvider.js'
	], 'server');

	api.mainModule('server/index.js', 'server');
});
