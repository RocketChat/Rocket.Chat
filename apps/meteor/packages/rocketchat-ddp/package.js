Package.describe({
	name: 'rocketchat:ddp',
	version: '0.0.1',
	summary: '',
	git: '',
});

Package.onUse(function (api) {
	api.use(['ecmascript', 'socket-stream-client']);

	api.mainModule('client/index.js', 'client');
});
