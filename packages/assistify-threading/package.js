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
	api.use('meteorhacks:inject-initial'); // for provisioning of svg-icons

	api.addFiles('config.js', 'server');
	api.addFiles('authorization.js', 'server');
	api.addFiles('permissions.js', 'server');
	api.addFiles('lib/messageTypes/threadMessage.js');
	api.addFiles('lib/threadRoomType.js');

	// Libraries
	api.addFiles('server/inject.js', 'server');

	// Extensions to the rest of RC
	api.addFiles('server/models/RoomsExtension.js', 'server');
	api.addFiles('server/models/MessagesExtension.js', 'server');
	api.addFiles('server/hooks/joinThreadOnMessage.js', 'server');
	api.addFiles('server/hooks/propagateThreadMetadata.js', 'server');
	api.addFiles('server/publications/threadParentAutocomplete.js', 'server');
	api.addFiles('server/publications/threadsOfRoom.js', 'server');

	// Methods
	api.addFiles('server/methods/createThread.js', 'server');
	api.addFiles('server/methods/getParentChannelId.js', 'server');
	api.addFiles('server/methods/getParentChannelList.js', 'server');
	// api.addFiles('server/methods/expertiseList.js', 'server');

	// UI artifacts which are pre-processed or packaged by the server
	api.addAssets('client/public/icons.svg', 'server');

	// /////// Client

	// Templates
	api.addFiles('client/views/creationDialog/CreateThread.html', 'client');
	api.addFiles('client/views/creationDialog/CreateThread.js', 'client');
	api.addFiles('client/views/creationDialog/CreateThreadInputError.html', 'client');
	api.addFiles('client/views/creationDialog/CreateThreadAutocomplete.html', 'client');
	api.addFiles('client/views/creationDialog/ChannelNotFound.html', 'client');
	api.addFiles('client/views/creationDialog/ChannelNotFound.js', 'client');
	api.addFiles('client/views/creationDialog/ChannelSelection.html', 'client');
	api.addFiles('client/views/creationDialog/ChannelSelection.js', 'client');
	api.addFiles('client/views/ThreadList.html', 'client');
	api.addFiles('client/views/ThreadList.js', 'client');
	api.addFiles('client/views/ThreadsTabbar.html', 'client');
	api.addFiles('client/views/ThreadsTabbar.js', 'client');
	api.addFiles('client/views/fieldTypeThreadReplyCounter.html', 'client');
	api.addFiles('client/views/fieldTypeThreadReplyCounter.js', 'client');
	api.addFiles('client/views/fieldTypeThreadLastMessageAge.html', 'client');
	api.addFiles('client/views/fieldTypeThreadLastMessageAge.js', 'client');

	// Other UI extensions
	api.addFiles('client/createThreadMessageAction.js', 'client');
	api.addFiles('client/threadFromMessageBox.js', 'client');
	api.addFiles('client/tabBar.js', 'client');

	// styling
	api.addFiles('client/public/stylesheets/threading.css', 'client');
});
