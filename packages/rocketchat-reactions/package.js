Package.describe({
	name: 'rocketchat:reactions',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('templating');
	api.use('rocketchat:lib');
	api.use('rocketchat:theme');
	api.use('rocketchat:ui');

	api.addFiles('client/init.js', 'client');

	api.addFiles('server/models/Messages.js');
	api.addFiles('client/methods/setReaction.js', 'client');
	api.addFiles('setReaction.js', 'server');

	api.addFiles('client/stylesheets/reaction.css', 'client');
});
