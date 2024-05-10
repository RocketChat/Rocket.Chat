Package.describe({
	name: 'rocketchat:mongo-config',
	version: '0.0.1',
	summary: '',
	git: '',
});

Package.onUse(function (api) {
	api.use(['ecmascript', 'mongo', 'email', 'http']);

	api.mainModule('server/index.js', 'server');
});
