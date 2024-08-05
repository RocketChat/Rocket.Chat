Package.describe({
	name: 'rocketchat:user-presence',
	summary: 'Track user status',
	version: '2.6.3',
	git: 'https://github.com/Konecty/meteor-user-presence',
});

Package.onUse(function (api) {
	api.use('tracker');
	api.use('check');
	api.use('ecmascript');

	api.mainModule('client/client.js', 'client');
});

Npm.depends({
	colors: '1.3.2',
});
