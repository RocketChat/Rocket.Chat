Package.describe({
	name: 'rocketchat:emoji-custom',
	version: '1.0.0',
	summary: 'Message pre-processor that will translate custom emoji',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:emoji',
		'rocketchat:file',
		'rocketchat:lib',
		'templating',
		'webapp',
		'kadira:flow-router',
		'kadira:blaze-layout',
	]);

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
