Package.describe({
	name: 'assistify:threading',
	version: '0.1.0',
	summary: 'Adds heavy-weight threading to Rocket.Chat',
	git: 'http://github.com/assistify/Rocket.Chat',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');
	api.use(['ecmascript']);
	api.use('rocketchat:authorization'); //In order to create custom permissions
	api.use('templating', 'client');
	// api.use('meteorhacks:inject-initial'); //for provisioning of svg-icons

	api.addFiles('config.js', 'server');
	// api.addFiles('lib/messageTypes/threadMessage.js'); // TODO: Decide what to do with the rendered message types. They are less usable on mobile,but provide good experience on browser.

	// Libraries
	// api.addFiles('server/inject.js', 'server');

	//Methods
	api.addFiles('server/methods/createThread.js', 'server');
	api.addFiles('server/methods/getParentChannelId.js', 'server');
	// api.addFiles('server/methods/expertiseList.js', 'server');

	// we have all migrations in one single file
	// api.addFiles('server/migrations.js', 'server');

	// UI artifacts which are pre-processed or packaged by the server
	// api.addAssets('client/public/icons.svg', 'server');

	///////// Client

	//Templates
	api.addFiles('client/views/creationDialog/CreateThread.html', 'client');
	api.addFiles('client/views/creationDialog/CreateThread.js', 'client');
	api.addFiles('client/views/creationDialog/CreateThreadInputError.html', 'client');
	// api.addFiles('client/views/creationDialog/AssistifyWordCloud.html', 'client'); // TODO: add wordcloud - but when doing this, ensure the sizes are based on the member-count (non-linear!)
	// api.addFiles('client/views/creationDialog/AssistifyWordCloud.js', 'client');
	api.addFiles('client/views/creationDialog/CreateThreadAutocomplete.html', 'client');
	// api.addFiles('client/views/creationDialog/AssistifyTopicSearchEmpty.html', 'client');
	// api.addFiles('client/views/creationDialog/AssistifyTopicSearchEmpty.js', 'client');
	// api.addFiles('client/views/messageActions/ThreadMessageAction.js', 'client'); // TODO: Re-add

	//styling
	api.addFiles('client/public/stylesheets/threading.css', 'client');
});
