Package.describe({
	name: 'rocketchat:livechat',
	version: '0.0.1',
	summary: 'Livechat plugin for Rocket.Chat',
});

Package.registerBuildPlugin({
	name: 'Livechat',
	use: [
		'ecmascript',
	],
	sources: [
		'plugin/build-livechat.js',
	],
	npmDependencies: {
		shelljs: '0.8.1',
		'uglify-js': '2.8.29',
	},
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'webapp',
		'autoupdate',
		'rocketchat:utils',
		'rocketchat:action-links',
		'rocketchat:ui-utils',
		'rocketchat:settings',
		'rocketchat:callbacks',
		'rocketchat:models',
		'rocketchat:lib',
		'rocketchat:authorization',
		'rocketchat:logger',
		'rocketchat:api',
		'rocketchat:theme',
		'rocketchat:streamer',
		'konecty:user-presence',
		'rocketchat:ui',
		'kadira:flow-router',
		'kadira:blaze-layout',
		'templating',
		'http',
		'check',
		'mongo',
		'ddp-rate-limiter',
		'rocketchat:sms',
		'tracker',
		'less',
	]);
	// livechat app
	api.addAssets('assets/demo.html', 'client');
	// DEPRECATED
	api.addAssets('assets/rocket-livechat.js', 'client'); // this file is still added to not break currently installed livechat widgets
	api.addAssets('assets/rocketchat-livechat.min.js', 'client');
	api.addAssets('public/head.html', 'server');
	api.addFiles('client/stylesheets/livechat.less', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
