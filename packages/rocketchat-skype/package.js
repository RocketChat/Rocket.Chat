Package.describe({
	name: 'rocketchat:skype',
	version: '0.0.1',
	summary: 'Simple integration with skype',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'underscore',
		'rocketchat:lib',
		'less@2.5.0'
	]);

	api.use('templating', 'client');

	api.addFiles('client/collection.coffee', 'client');
	api.addFiles('client/tabBar.coffee', 'client');
	api.addFiles('client/views/skypeIntegration.html', 'client');
	api.addFiles('client/views/skypeIntegration.coffee', 'client');
	api.addFiles('client/stylesheets/skypeIntegration.less', 'client');

	api.addFiles('server/models/Users.coffee', 'server');
	api.addFiles('server/methods/updateSkypeLogin.coffee', 'server');
	api.addFiles('server/publications/skypeLogins.coffee', 'server');

});
