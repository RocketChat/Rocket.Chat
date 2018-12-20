Package.describe({
	name: 'rocketchat:e2e',
	version: '0.0.1',
	summary: 'End-to-End encrypted conversations for Rocket.Chat',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'less',
		'mizzao:timesync',
		'rocketchat:lib',
		'rocketchat:utils',
		'templating',
		'sha',
	]);
	api.addFiles('client/stylesheets/e2e.less', 'client');
	api.mainModule('client/rocketchat.e2e.js', 'client');
	api.mainModule('server/index.js', 'server');
});
