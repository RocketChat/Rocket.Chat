Package.describe({
	name: 'rocketchat:e2e',
	version: '0.0.1',
	summary: 'End-to-End encrypted conversations for Rocket.Chat',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'less',
		'rocketchat:lib',
		'tracker',
		'reactive-var'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/libsignal.js',
		'client/rocketchat.e2e.js',
		'client/rocketchat.e2e.room.js',
		'client/stylesheets/e2e.less',
		'client/views/e2eFlexTab.html',
		'client/views/e2eFlexTab.js',
		'client/tabBar.js',
		'client/helper.js',
		'client/store.js'
	], 'client');

	api.addFiles([
		'server/settings.js',
		'server/models/Users.js',
		'server/models/Subscriptions.js',
		'server/methods/addKeyToChain.js',
		'server/methods/fetchKeychain.js',
		'server/methods/emptyKeychain.js',
		'server/methods/updateGroupE2EKey.js',
		'server/methods/fetchGroupE2EKey.js',
		'server/methods/fetchMyKeys.js'
	], 'server');
});
