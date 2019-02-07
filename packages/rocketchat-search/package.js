Package.describe({
	name: 'rocketchat:search',
	version: '0.0.1',
	summary: 'Rocketchat Search Providers',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:logger',
		'kadira:flow-router',
	]);
	api.addFiles('client/style/style.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
