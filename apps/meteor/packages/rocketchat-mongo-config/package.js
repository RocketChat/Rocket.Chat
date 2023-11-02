Package.describe({
	name: 'rocketchat:mongo-config',
	version: '0.0.1',
	summary: '',
	git: '',
});

Package.onUse((api) => {
	api.use(['ecmascript', 'mongo', 'email', 'http', 'webapp', 'meteor']);

	api.mainModule('server/index.js', 'server');
});
