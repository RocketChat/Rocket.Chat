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
	api.use('meteorhacks:inject-initial'); //for provisioning of svg-icons

	api.addFiles('config.js', 'server');
	api.addFiles('auth.js', 'server');
	api.addFiles('lib/messageTypes/threadMessage.js');
	api.addFiles('lib/threadRoomType.js');

	// Libraries
	api.addFiles('server/inject.js', 'server');

	// Extensions to the rest of RC
	api.addFiles('server/models/RoomsExtension.js', 'server');
	api.addFiles('server/publications/threadParentAutocomplete.js', 'server');

	//Methods
	api.addFiles('server/methods/createThread.js', 'server');
	api.addFiles('server/methods/getParentChannelId.js', 'server');
	api.addFiles('server/methods/getParentChannelList.js', 'server');
	// api.addFiles('server/methods/expertiseList.js', 'server');

	// UI artifacts which are pre-processed or packaged by the server
	api.addAssets('client/public/icons.svg', 'server');

	///////// Client

	//Templates
	api.addFiles('client/views/creationDialog/CreateThread.html', 'client');
	api.addFiles('client/views/creationDialog/CreateThread.js', 'client');
	api.addFiles('client/views/creationDialog/CreateThreadInputError.html', 'client');
	api.addFiles('client/views/creationDialog/CreateThreadAutocomplete.html', 'client');
	api.addFiles('client/views/creationDialog/ChannelNotFound.html', 'client');
	api.addFiles('client/views/creationDialog/ChannelNotFound.js', 'client');
	api.addFiles('client/views/creationDialog/ChannelSelection.html', 'client');
	api.addFiles('client/views/creationDialog/ChannelSelection.js', 'client');
	api.addFiles('client/views/threadList.html', 'client');
	api.addFiles('client/views/threadList.js', 'client');

	// Other UI extensions
	api.addFiles('client/createThreadMessageAction.js', 'client');
	api.addFiles('client/threadFromMessageBox.js', 'client');

	//styling
	api.addFiles('client/public/stylesheets/threading.css', 'client');
});
