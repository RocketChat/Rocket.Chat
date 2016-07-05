Package.describe({
	name: 'voismart:user-call',
	version: '0.0.1',
	summary: 'Call an user by double clicking on him',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'underscore',
		'templating',
		'rocketchat:lib',
		'rocketchat:theme',
		'rocketchat:ui'
	]);

	api.addFiles([
		'client/call.coffee',
	], 'client');

});
