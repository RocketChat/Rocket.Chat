Package.describe({
	name: 'rocketchat:accounts',
	version: '0.0.1',
	summary: 'JS-Accounts integration',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'underscore',
		'ecmascript',
	]);

	api.use('mongo', ['client', 'server']);

	api.mainModule('server/index.js', 'server');
});
