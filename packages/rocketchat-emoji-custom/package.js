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
		'rocketchat:utils',
		'rocketchat:models',
		'rocketchat:settings',
		'rocketchat:authorization',
		'rocketchat:notifications',
		'rocketchat:ui-cached-collection',
		'rocketchat:ui-utils',
		'templating',
		'webapp',
		'kadira:flow-router',
		'kadira:blaze-layout',
	]);
	api.addFiles('assets/stylesheets/emojiCustomAdmin.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
