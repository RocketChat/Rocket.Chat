Package.describe({
	name: 'voismart:disable-cordova-otr',
	version: '0.0.1',
	summary: 'Disable OTR on cordova'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
			'coffeescript',
			'rocketchat:otr',
			'reactive-var',
			'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles(['removeOTR.coffee'], 'client');

});
