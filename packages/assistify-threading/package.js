Package.describe({
	name: 'assistify:threading',
	version: '0.1.0',
	summary: 'Adds heavy-weight threading to Rocket.Chat',
	git: 'http://github.com/assistify/Rocket.Chat',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');
	api.use(['ecmascript', 'mizzao:autocomplete']);
	api.use('rocketchat:authorization'); // In order to create custom permissions
	api.use('rocketchat:callbacks', 'server');
	api.use('rocketchat:models', 'server');
	api.use('templating', 'client');

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');

	// styling
	api.addFiles('client/public/stylesheets/threading.css', 'client');
});
