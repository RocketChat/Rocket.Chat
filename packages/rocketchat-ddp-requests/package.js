Package.describe({
	name: 'rocketchat:ddp-requests',
	version: '0.0.1',
	summary: 'Package that implements DDP requests from the server to the client',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use('mongo');
	api.use('random');
	api.use('ecmascript');
	api.use('templating');
	api.use('babel-compiler');

	api.use('rocketchat:authorization');
	api.use('rocketchat:api');
	api.use('rocketchat:lib');
	api.use('rocketchat:logger');

	api.addFiles('server/startup.js', 'server');

	api.addFiles('server/functions/sendDdpRequest.js', 'server');
	api.addFiles('server/functions/setCustomClientData.js', 'server');
	api.addFiles('server/functions/resetCustomClientData.js', 'server');

	api.addFiles('server/methods/replyToDdpRequest.js', 'server');
	api.addFiles('server/methods/setCustomClientData.js', 'server');
});
