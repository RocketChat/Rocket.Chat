Package.describe({
	summary: 'Update the client when new client code is available',
	version: '1.8.0',
});

Package.onUse(function(api) {
	api.use(['webapp', 'check', 'inter-process-messaging'], 'server');

	api.use(['tracker', 'retry'], 'client');

	api.use('reload', 'client', { weak: true });

	api.use(['ecmascript', 'ddp'], ['client', 'server']);

	api.mainModule('autoupdate_server.js', 'server');
	api.mainModule('autoupdate_client.js', 'client');

	api.export('Autoupdate');
});
