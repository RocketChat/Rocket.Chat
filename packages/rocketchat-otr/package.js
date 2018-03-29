Package.describe({
	name: 'rocketchat:otr',
	version: '0.0.1',
	summary: 'Off-the-record messaging for Rocket.Chat',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'ecmascript',
		'rocketchat:lib',
		'tracker',
		'reactive-var'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/rocketchat.otr.js',
		'client/rocketchat.otr.room.js',
		'client/stylesheets/otr.css',
		'client/views/otrFlexTab.html',
		'client/views/otrFlexTab.js',
		'client/tabBar.js'
	], 'client');

	api.addFiles([
		'server/settings.js',
		'server/models/Messages.js',
		'server/methods/deleteOldOTRMessages.js',
		'server/methods/updateOTRAck.js'
	], 'server');
});
